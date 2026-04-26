import type { ReviewGroup } from '../game/engine/types.public';
import { Modal } from './Modal';

type ReviewPanelProps = {
  groups: ReviewGroup[];
  onClose: () => void;
};

export function ReviewPanel({ groups, onClose }: ReviewPanelProps) {
  return (
    <Modal
      title="Review words"
      onClose={onClose}
      panelClassName="review-panel"
      actions={
        <button className="button button--ghost" type="button" onClick={onClose}>
          Back to round
        </button>
      }
    >
      <div className="review-groups">
        {groups.map((group) => (
          <section key={group.label} className="review-group">
            <h3>{group.label}</h3>
            <ul>
              {group.words.map((word) => (
                <li key={word.id}>
                  <span>{word.word}</span>
                  <span>{word.translation}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
