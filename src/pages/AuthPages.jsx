import React, { useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input, Button, Alert } from '../components/common/UI';

// ─── Form Validator (OOP) ────────────────────────────────────────────────────

/**
 * FormValidator encapsulates validation rules for auth forms.
 * Each method returns an error string or null if valid.
 */
class FormValidator {
  static validateName(name) {
    if (!name.trim()) return 'Name is required.';
    if (name.trim().length < 2) return 'Name must be at least 2 characters.';
    return null;
  }

  static validateEmail(email) {
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
    return null;
  }

  static validatePassword(password) {
    if (!password) return 'Password is required.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
    return null;
  }

  static validateConfirmPassword(password, confirm) {
    if (!confirm) return 'Please confirm your password.';
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  }

  /** Validate login fields, returns object of field → error */
  static validateLogin({ email, password }) {
    const errors = {};
    const emailErr = this.validateEmail(email);
    const passwordErr = this.validatePassword(password);
    if (emailErr) errors.email = emailErr;
    if (passwordErr) errors.password = passwordErr;
    return errors;
  }

  /** Validate registration fields */
  static validateRegister({ name, email, password, confirmPassword }) {
    const errors = {};
    const nameErr = this.validateName(name);
    const emailErr = this.validateEmail(email);
    const passwordErr = this.validatePassword(password);
    const confirmErr = this.validateConfirmPassword(password, confirmPassword);
    if (nameErr) errors.name = nameErr;
    if (emailErr) errors.email = emailErr;
    if (passwordErr) errors.password = passwordErr;
    if (confirmErr) errors.confirmPassword = confirmErr;
    return errors;
  }

  static hasErrors(errorsObj) {
    return Object.keys(errorsObj).length > 0;
  }
}

// ─── PasswordRules ───────────────────────────────────────────────────────────

const PASSWORD_RULES = [
  { id: 'length',  label: 'At least 8 characters',          test: (p) => p.length >= 8 },
  { id: 'upper',   label: 'At least one uppercase letter',   test: (p) => /[A-Z]/.test(p) },
  { id: 'number',  label: 'At least one number',             test: (p) => /[0-9]/.test(p) },
];

function PasswordRules({ password }) {
  if (!password) return null;
  return (
    <ul style={{ listStyle: 'none', margin: '0.35rem 0 0.75rem', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      {PASSWORD_RULES.map(({ id, label, test }) => {
        const passed = test(password);
        return (
          <li key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: passed ? 'var(--green)' : 'var(--text-2)', transition: 'color var(--transition)' }}>
            <span style={{ fontWeight: 700, width: '1rem', textAlign: 'center' }}>{passed ? '✓' : '✗'}</span>
            {label}
          </li>
        );
      })}
    </ul>
  );
}

// ─── LoginPage ───────────────────────────────────────────────────────────────

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [fields, setFields] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: null }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const errors = FormValidator.validateLogin(fields);
    if (FormValidator.hasErrors(errors)) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const user = await login(fields.email, fields.password);
      const dest = from || (user.isAdmin ? '/admin' : '/dashboard');
      navigate(dest, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__split">
        <AuthBranding />
        <div className="auth-page__form-side">
          <div className="auth-form">
            <div className="auth-form__header">
              <h1 className="auth-form__title">Welcome back</h1>
              <p className="auth-form__sub">Sign in to your Class Host account</p>
            </div>

            <Alert message={serverError} type="error" onDismiss={() => setServerError('')} />

            <form onSubmit={handleSubmit} noValidate>
              <Input
                label="Email address"
                id="email"
                type="email"
                name="email"
                value={fields.email}
                onChange={handleChange}
                error={fieldErrors.email}
                placeholder="you@example.com"
                autoComplete="email"
              />
              <Input
                label="Password"
                id="password"
                type="password"
                name="password"
                value={fields.password}
                onChange={handleChange}
                error={fieldErrors.password}
                placeholder="Your password"
                autoComplete="current-password"
              />

              <div className="auth-form__options">
                <Link to="/forgot-password" className="auth-form__link auth-form__link--sm">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" variant="primary" loading={loading} className="auth-form__submit">
                Sign In
              </Button>
            </form>

            <p className="auth-form__switch">
              Don't have an account?{' '}
              <Link to="/register" className="auth-form__link">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RegisterPage ────────────────────────────────────────────────────────────

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fields, setFields] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: null }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const errors = FormValidator.validateRegister(fields);
    if (FormValidator.hasErrors(errors)) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const user = await register(fields.name, fields.email, fields.password);
      navigate(user.isAdmin ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__split">
        <AuthBranding />
        <div className="auth-page__form-side">
          <div className="auth-form">
            <div className="auth-form__header">
              <h1 className="auth-form__title">Create account</h1>
              <p className="auth-form__sub">Join Class Host — it's free to start</p>
            </div>

            <Alert message={serverError} type="error" onDismiss={() => setServerError('')} />

            <form onSubmit={handleSubmit} noValidate>
              <Input
                label="Full name"
                id="name"
                type="text"
                name="name"
                value={fields.name}
                onChange={handleChange}
                error={fieldErrors.name}
                placeholder="Jane Smith"
                autoComplete="name"
              />
              <Input
                label="Email address"
                id="email"
                type="email"
                name="email"
                value={fields.email}
                onChange={handleChange}
                error={fieldErrors.email}
                placeholder="you@example.com"
                autoComplete="email"
              />
              <Input
                label="Password"
                id="password"
                type="password"
                name="password"
                value={fields.password}
                onChange={handleChange}
                error={fieldErrors.password}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
              <PasswordRules password={fields.password} />
              <Input
                label="Confirm password"
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={fields.confirmPassword}
                onChange={handleChange}
                error={fieldErrors.confirmPassword}
                placeholder="Repeat your password"
                autoComplete="new-password"
              />

              <Button type="submit" variant="primary" loading={loading} className="auth-form__submit">
                Create Account
              </Button>
            </form>

            <p className="auth-form__switch">
              Already have an account?{' '}
              <Link to="/login" className="auth-form__link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared branding panel ────────────────────────────────────────────────────

function AuthBranding() {
  return (
    <div className="auth-page__brand-side">
      <div className="auth-brand">
        <Link to="/" className="auth-brand__logo">
          <span className="landing__logo-mark">◈</span>
          Class Host
        </Link>
        <blockquote className="auth-brand__quote">
          "A smarter way to keep every student engaged."
        </blockquote>
        <ul className="auth-brand__features">
          <li>✓ Ask questions and collect answers in real time</li>
          <li>✓ See how your whole class is doing at a glance</li>
          <li>✓ Students get helpful feedback right away</li>
          <li>✓ Free to use — no setup required for students</li>
        </ul>
      </div>
      <div className="auth-brand__bg" />
    </div>
  );
}