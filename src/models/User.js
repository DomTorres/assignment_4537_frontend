/**
 * User model representing a registered user in the system.
 * Encapsulates all user-related data and behaviour.
 */
export class User {
  constructor({ id, email, name, role, apiCallsUsed = 0, apiCallsLimit = 20, createdAt = null }) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.role = role; // 'student' | 'admin'
    this.apiCallsUsed = apiCallsUsed;
    this.apiCallsLimit = apiCallsLimit;
    this.createdAt = createdAt ? new Date(createdAt) : new Date();
  }

  /** Returns remaining API calls for this user */
  get remainingCalls() {
    return Math.max(0, this.apiCallsLimit - this.apiCallsUsed);
  }

  /** Returns usage as a percentage (0–100) */
  get usagePercentage() {
    return Math.min(100, (this.apiCallsUsed / this.apiCallsLimit) * 100);
  }

  /** Whether the user has exhausted their free tier */
  get isLimitReached() {
    return this.apiCallsUsed >= this.apiCallsLimit;
  }

  /** Whether this user is an administrator */
  get isAdmin() {
    return this.role === 'admin';
  }

  /** Whether this user is a student */
  get isStudent() {
    return this.role === 'student';
  }

  /** Serialize to a plain object for storage */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      apiCallsUsed: this.apiCallsUsed,
      apiCallsLimit: this.apiCallsLimit,
      createdAt: this.createdAt.toISOString(),
    };
  }

  /** Construct a User from a plain API response object */
  static fromAPI(data) {
    return new User(data);
  }

  /** Construct a User from localStorage JSON */
  static fromStorage(json) {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json;
      return new User(data);
    } catch {
      return null;
    }
  }
}
