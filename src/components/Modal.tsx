import { useEffect, useId } from 'react';
import type { ReactNode } from 'react';

type ModalProps = {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  onClose?: () => void;
  dismissible?: boolean;
  panelClassName?: string;
};

export function Modal({
  title,
  children,
  actions,
  onClose,
  dismissible = true,
  panelClassName
}: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!dismissible || !onClose) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dismissible, onClose]);

  return (
    <div className="modal-overlay" role="presentation" onClick={dismissible ? onClose : undefined}>
      <section
        className={`modal-panel ${panelClassName ?? ''}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id={titleId}>{title}</h2>
          {dismissible && onClose ? (
            <button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog">
              ×
            </button>
          ) : null}
        </header>
        <div className="modal-body">{children}</div>
        {actions ? <footer className="modal-actions">{actions}</footer> : null}
      </section>
    </div>
  );
}
