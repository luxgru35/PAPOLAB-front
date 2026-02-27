import { forwardRef, useState, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  rightSlot?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, rightSlot, className = '', id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="form-group">
        <label className="form-label" htmlFor={inputId}>
          {label}
        </label>
        <div className="input-wrap">
          <input
            ref={ref}
            id={inputId}
            className={`form-input ${error ? 'error' : ''} ${className}`}
            {...props}
          />
          {rightSlot && <span className="input-slot">{rightSlot}</span>}
        </div>
        {error && <span className="field-error">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ── Eye toggle button ────────────────────────────
interface EyeToggleProps {
  visible: boolean;
  onToggle: () => void;
}

export function EyeToggle({ visible, onToggle }: EyeToggleProps) {
  return (
    <button type="button" className="toggle-pw" onClick={onToggle} title={visible ? 'Скрыть' : 'Показать'}>
      {visible ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

// ── Password input composite ─────────────────────
interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, ...props }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <Input
        ref={ref}
        label={label}
        error={error}
        type={show ? 'text' : 'password'}
        rightSlot={<EyeToggle visible={show} onToggle={() => setShow((v) => !v)} />}
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
