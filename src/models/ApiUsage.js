/**
 * ApiUsage model tracks a user's API consumption history.
 * Each instance represents a single API call record.
 */
export class ApiUsageRecord {
  constructor({ id, endpoint, timestamp, success, responseTime }) {
    this.id = id;
    this.endpoint = endpoint;
    this.timestamp = timestamp ? new Date(timestamp) : new Date();
    this.success = success;
    this.responseTime = responseTime; // ms
  }

  get formattedTime() {
    return this.timestamp.toLocaleString();
  }

  static fromAPI(data) {
    return new ApiUsageRecord(data);
  }
}

/**
 * ApiUsageSummary aggregates usage records for a user.
 */
export class ApiUsageSummary {
  constructor({ used, limit, records = [] }) {
    this.used = used;
    this.limit = limit;
    this.records = records.map((r) => new ApiUsageRecord(r));
  }

  get remaining() {
    return Math.max(0, this.limit - this.used);
  }

  get percentage() {
    return Math.min(100, (this.used / this.limit) * 100);
  }

  get isNearLimit() {
    return this.percentage >= 80;
  }

  get isAtLimit() {
    return this.used >= this.limit;
  }

  static fromAPI(data) {
    return new ApiUsageSummary(data);
  }
}
