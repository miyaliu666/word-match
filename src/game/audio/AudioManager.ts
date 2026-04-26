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

function buildSoundUrls(): Partial<Record<SoundEvent, string>> {
  const urls: Partial<Record<SoundEvent, string>> = {};

  Object.entries(AUDIO_FILE_MODULES).forEach(([modulePath, url]) => {
    const fileName = modulePath.split('/').pop()?.toLowerCase() ?? '';
    const eventPrefix = fileName.split('-')[0]?.trim() ?? '';
    const event = toSoundEvent(eventPrefix);

    if (event && !urls[event]) {
      urls[event] = url;
    }
  });

  return urls;
}

const SOUND_URLS = buildSoundUrls();

export class AudioManager {
  private activeElements = new Set<HTMLAudioElement>();
  private unlocked = false;

  async ensureReady(): Promise<void> {
    if (this.unlocked || typeof Audio === 'undefined') {
      return;
    }

    const warmupUrl = SOUND_URLS.select ?? Object.values(SOUND_URLS)[0];
    if (!warmupUrl) {
      this.unlocked = true;
      return;
    }

    const warmupAudio = new Audio(warmupUrl);
    warmupAudio.preload = 'auto';
    warmupAudio.volume = 0;
    warmupAudio.muted = true;
    warmupAudio.setAttribute('playsinline', 'true');
    warmupAudio.setAttribute('webkit-playsinline', 'true');

    try {
      await warmupAudio.play();
      warmupAudio.pause();
      warmupAudio.currentTime = 0;
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

    const url = SOUND_URLS[event];
    if (!url || typeof Audio === 'undefined') {
      return;
    }

    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.volume = 0.7;
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    this.activeElements.add(audio);

    const cleanup = () => {
      this.activeElements.delete(audio);
      audio.onended = null;
      audio.onerror = null;
    };

    audio.onended = cleanup;
    audio.onerror = cleanup;

    try {
      await audio.play();
    } catch {
      cleanup();
    }
  }
}

export const audioManager = new AudioManager();
