import type { LevelDefinition } from '../data/levels';
import { Modal } from './Modal';

type LevelPickerProps = {
  levels: LevelDefinition[];
  currentLevelId: number;
  completedLevels: number[];
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
};

export function LevelPicker({
  levels,
  currentLevelId,
  completedLevels,
  onSelectLevel,
  onClose
}: LevelPickerProps) {
  return (
    <Modal title="Levels" onClose={onClose} panelClassName="level-picker-modal">
      <div className="level-picker">
        {levels.map((level) => {
          const isCurrent = level.id === currentLevelId;
          const isCompleted = completedLevels.includes(level.id);

          return (
            <button
              key={level.id}
              className={[
                'level-card',
                isCurrent ? 'level-card--current' : '',
                isCompleted ? 'level-card--completed' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              type="button"
              onClick={() => onSelectLevel(level.id)}
            >
              <div className="level-card__left">
                <span className="level-card__badge">{level.cefr}</span>
                <strong>{level.label}</strong>
              </div>
              {isCompleted ? <span className="level-card__status level-card__status--completed">Completed</span> : null}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
