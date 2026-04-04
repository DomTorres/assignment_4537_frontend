/**
 * AuthToken model encapsulates JWT token management.
 * Handles storage, expiry checks, and decoding.
 */
export class AuthToken {
  static STORAGE_KEY = 'auth_token';

  constructor(rawToken) {
    this.raw = rawToken;
    this._payload = this._decode(rawToken);
  }

  /** Decode JWT payload without verifying signature (verification is server-side) */
  _decode(token) {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }

  get isValid() {
    return Boolean(this._payload);
  }

  get isExpired() {
    if (!this._payload?.exp) return true;
    return Date.now() / 1000 > this._payload.exp;
  }

  get userId() {
    return this._payload?.sub ?? null;
  }

  get role() {
    return this._payload?.role ?? null;
  }

  /** Persist token to localStorage */
  save() {
    localStorage.setItem(AuthToken.STORAGE_KEY, this.raw);
  }

  /** Remove token from localStorage */
  static clear() {
    localStorage.removeItem(AuthToken.STORAGE_KEY);
  }

  /** Load token from localStorage, returns null if missing or invalid */
  static load() {
    const raw = localStorage.getItem(AuthToken.STORAGE_KEY);
    if (!raw) return null;
    const token = new AuthToken(raw);
    if (!token.isValid || token.isExpired) {
      // Clean up stale/invalid token so it doesn't block navigation
      AuthToken.clear();
      localStorage.removeItem('current_user');
      return null;
    }
    return token;
  }

  toString() {
    return this.raw;
  }
}
