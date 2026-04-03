import { BaseApiService } from './BaseApiService';
import { AuthToken } from '../models/AuthToken';
import { User } from '../models/User';

/**
 * AuthService handles all authentication-related API calls.
 * Extends BaseApiService for shared HTTP functionality.
 */
export class AuthService extends BaseApiService {
  constructor() {
    super();
  }

  /**
   * Register a new user account.
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @param {string} role - 'student' | 'admin'
   * @returns {Promise<{ user: User, token: AuthToken }>}
   */
  async register(name, email, password) {
    const data = await this.post('/auth/register', { name, email, password });
    const token = new AuthToken(data.token);
    const user = User.fromAPI(data.user);
    token.save();
    this._saveUser(user);
    return { user, token };
  }

  /**
   * Log in an existing user.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ user: User, token: AuthToken }>}
   */
  async login(email, password) {
    const data = await this.post('/auth/login', { email, password });
    const token = new AuthToken(data.token);
    const user = User.fromAPI(data.user);
    token.save();
    this._saveUser(user);
    return { user, token };
  }

  /** Clear session data from storage */
  logout() {
    AuthToken.clear();
    localStorage.removeItem('current_user');
  }

  /**
   * Attempt to restore a session from localStorage.
   * Returns null if no valid session exists.
   * @returns {{ user: User, token: AuthToken } | null}
   */
  restoreSession() {
    const token = AuthToken.load();
    if (!token) return null;
    const user = User.fromStorage(localStorage.getItem('current_user'));
    if (!user) return null;
    return { user, token };
  }

  _saveUser(user) {
    localStorage.setItem('current_user', JSON.stringify(user.toJSON()));
  }
}

// Singleton export — one instance shared across the app
export const authService = new AuthService();
