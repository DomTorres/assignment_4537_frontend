import { BaseApiService } from './BaseApiService';
import { User } from '../models/User';
import { ApiUsageSummary } from '../models/ApiUsage';

/**
 * AdminService handles admin-only API operations.
 * All endpoints require an admin-role JWT token.
 */
export class AdminService extends BaseApiService {
  constructor() {
    super();
  }

  /** Fetch all registered users */
  async getAllUsers() {
    const data = await this.get('/admin/users');
    return data.users.map(User.fromAPI);
  }

  /** Fetch API usage summary for all users */
  async getAllUsageSummaries() {
    const data = await this.get('/admin/usage');
    return data.summaries.map((s) => ({
      user: User.fromAPI(s.user),
      usage: ApiUsageSummary.fromAPI(s.usage),
    }));
  }

  /** Reset a specific user's API call counter */
  async resetUserUsage(userId) {
    const data = await this.put(`/admin/users/${userId}/reset-usage`);
    return User.fromAPI(data.user);
  }

  /** Delete a user account */
  async deleteUser(userId) {
    return this.delete(`/admin/users/${userId}`);
  }
}

export const adminService = new AdminService();
