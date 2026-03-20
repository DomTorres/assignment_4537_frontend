import React from 'react';

// ─── Button ───────────────────────────────────────────────────────────────────

/**
 * Button component with variant and loading state support.
 */
export function Button({ children, variant = 'primary', loading = false, className = '', ...props }) {
  return (
    <button
      className={`btn btn--${variant} ${loading ? 'btn--loading' : ''} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className="btn__spinner" /> : null}
      <span className={loading ? 'btn__text--hidden' : ''}>{children}</span>
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

/**
 * Labelled input with error message support.
 */
export function Input({ label, id, error, className = '', ...props }) {
  return (
    <div className={`field ${className}`}>
      {label && <label className="field__label" htmlFor={id}>{label}</label>}
      <input id={id} className={`field__input ${error ? 'field__input--error' : ''}`} {...props} />
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

export function Textarea({ label, id, error, className = '', ...props }) {
  return (
    <div className={`field ${className}`}>
      {label && <label className="field__label" htmlFor={id}>{label}</label>}
      <textarea id={id} className={`field__input field__input--textarea ${error ? 'field__input--error' : ''}`} {...props} />
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}

// ─── Alert ────────────────────────────────────────────────────────────────────

/**
 * Alert banner for success / warning / error feedback.
 */
export function Alert({ message, type = 'error', onDismiss }) {
  if (!message) return null;
  return (
    <div className={`alert alert--${type}`} role="alert">
      <span>{message}</span>
      {onDismiss && (
        <button className="alert__dismiss" onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}

// ─── UsageMeter ───────────────────────────────────────────────────────────────

/**
 * Visual API call usage meter.
 * Shows used / total with a colour-coded progress bar.
 */
export function UsageMeter({ used, limit }) {
  const pct = Math.min(100, (used / limit) * 100);
  const level = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'ok';

  return (
    <div className="usage-meter">
      <div className="usage-meter__header">
        <span className="usage-meter__label">API Calls Used</span>
        <span className={`usage-meter__count usage-meter__count--${level}`}>
          {used} / {limit}
        </span>
      </div>
      <div className="usage-meter__track">
        <div
          className={`usage-meter__fill usage-meter__fill--${level}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {level === 'danger' && (
        <p className="usage-meter__warning">
          ⚠ Free tier limit reached. Contact your administrator.
        </p>
      )}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

export function Badge({ children, variant = 'default' }) {
  return <span className={`badge badge--${variant}`}>{children}</span>;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner({ size = 'md' }) {
  return <div className={`spinner spinner--${size}`} aria-label="Loading" />;
}
