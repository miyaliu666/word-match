type SoundEvent =
  | 'select'
  | 'swap'
  | 'invalid'
  | 'match'
  | 'combo'
  | 'shuffle'
  | 'level_complete'
  | 'level_failed';

const SOUND_EVENTS: SoundEvent[] = [
  'select',
  'swap',
  'invalid',
  'match',
  'combo',
  'shuffle',
  'level_complete',
  'level_failed'
];

const AUDIO_FILE_MODULES = import.meta.glob('../../assets/audio/*.{mp3,wav,ogg,m4a,aac,flac}', {
  eager: true,
  import: 'default'
}) as Record<string, string>;

function toSoundEvent(value: string): SoundEvent | null {
  return SOUND_EVENTS.includes(value as SoundEvent) ? (value as SoundEvent) : null;
}

function parseSoundEventFromFileName(fileName: string): SoundEvent | null {
  const stem = fileName.replace(/\.[^/.]+$/, '').trim().toLowerCase();
  if (!stem) {
    return null;
  }

  const normalizedStem = stem.replace(/[\s-]+/g, '_');
  const exactMatch = toSoundEvent(normalizedStem);
  if (exactMatch) {
    return exactMatch;
  }

  return SOUND_EVENTS.find((event) => normalizedStem.startsWith(`${event}_`)) ?? null;
}

function buildSoundUrls(): Partial<Record<SoundEvent, string>> {
  const urls: Partial<Record<SoundEvent, string>> = {};

  Object.entries(AUDIO_FILE_MODULES).forEach(([modulePath, url]) => {
    const fileName = modulePath.split('/').pop()?.toLowerCase() ?? '';
    const event = parseSoundEventFromFileName(fileName);

    if (event && !urls[event]) {
      urls[event] = url;
    }
  });

  return urls;
}

const SOUND_URLS = buildSoundUrls();

export class AudioManager {
  private pools = new Map<SoundEvent, HTMLAudioElement[]>();
  private unlocked = false;
  private readyPromise: Promise<void> | null = null;
  private poolsPrimed = false;
  private readonly poolSize = 3;

  async ensureReady(): Promise<void> {
    if (this.unlocked || typeof Audio === 'undefined') {
      return;
    }

    if (this.readyPromise) {
      return this.readyPromise;
    }

    this.readyPromise = this.prepareAudio();
    try {
      await this.readyPromise;
    } finally {
      this.readyPromise = null;
    }
  }

  private async prepareAudio(): Promise<void> {
    this.primePools();

    try {
      for (const event of SOUND_EVENTS) {
        const pool = this.getPool(event);
        const audio = pool?.[0];
        if (!audio) {
          continue;
        }

        await this.waitUntilPlayable(audio);
        audio.volume = 0;
        audio.muted = true;

        try {
          await audio.play();
        } catch {
          // Ignore warmup failures so gameplay can continue.
        } finally {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
        }
      }
    } catch {
      // Ignore unlock failures so gameplay can continue.
    } finally {
      this.unlocked = true;
    }
  }

  async play(event: SoundEvent, enabled: boolean): Promise<void> {
    if (!enabled) {
      return;
    }

    const pool = this.getPool(event);
    if (!pool || pool.length === 0) {
      return;
    }

    const audio = pool.find((item) => item.paused || item.ended) ?? pool[0];
    audio.currentTime = 0;
    audio.volume = 0.7;

    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(() => {});
    }
  }

  private createAudioElement(url: string): HTMLAudioElement {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    audio.load();
    return audio;
  }

  private waitUntilPlayable(audio: HTMLAudioElement): Promise<void> {
    if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let settled = false;
      const timeoutMs = 1200;
      const timeoutId = window.setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        resolve();
      }, timeoutMs);

      const handleReady = () => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        resolve();
      };

      const cleanup = () => {
        window.clearTimeout(timeoutId);
        audio.removeEventListener('canplaythrough', handleReady);
        audio.removeEventListener('loadeddata', handleReady);
        audio.removeEventListener('error', handleReady);
      };

      audio.addEventListener('canplaythrough', handleReady, { once: true });
      audio.addEventListener('loadeddata', handleReady, { once: true });
      audio.addEventListener('error', handleReady, { once: true });
    });
  }

  private getPool(event: SoundEvent): HTMLAudioElement[] | null {
    if (typeof Audio === 'undefined') {
      return null;
    }

    const existingPool = this.pools.get(event);
    if (existingPool) {
      return existingPool;
    }

    const url = SOUND_URLS[event];
    if (!url) {
      return null;
    }

    const pool = new Array(this.poolSize).fill(null).map(() => this.createAudioElement(url));
    this.pools.set(event, pool);
    return pool;
  }

  private primePools(): void {
    if (this.poolsPrimed) {
      return;
    }

    SOUND_EVENTS.forEach((event) => {
      this.getPool(event);
    });
    this.poolsPrimed = true;
  }
}

export const audioManager = new AudioManager();
