import axios from 'axios';
import { AuthToken } from '../models/AuthToken';

/**
 * BaseApiService — abstract base class for all API services.
 * Provides a configured axios instance with auth headers and
 * centralised error handling that all child services inherit.
 */
export class BaseApiService {
  constructor(baseURL = import.meta.env.VITE_API_BASE_URL) {
    this.client = axios.create({ baseURL, timeout: 15000 });
    this._attachInterceptors();
  }

  /** Attach request / response interceptors */
  _attachInterceptors() {
    // Request: inject Bearer token if present
    this.client.interceptors.request.use((config) => {
      const token = AuthToken.load();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Response: normalise errors
    this.client.interceptors.response.use(
      (res) => res.data,
      (err) => {
        const message =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'An unexpected error occurred.';
        return Promise.reject(new ApiError(message, err.response?.status));
      }
    );
  }

  async get(path, params = {}) {
    return this.client.get(path, { params });
  }

  async post(path, body = {}) {
    return this.client.post(path, body);
  }

  async put(path, body = {}) {
    return this.client.put(path, body);
  }

  async delete(path) {
    return this.client.delete(path);
  }
}

/**
 * ApiError wraps HTTP errors with a status code for easy handling.
 */
export class ApiError extends Error {
  constructor(message, statusCode = 0) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }

  get isUnauthorized() { return this.statusCode === 401; }
  get isForbidden() { return this.statusCode === 403; }
  get isNotFound() { return this.statusCode === 404; }
  get isRateLimit() { return this.statusCode === 429; }
}
