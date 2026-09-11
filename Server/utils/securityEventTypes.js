/**
 * Standard Security & Audit Event Catalog
 * Direct mapping to CERT-In / DPDP audit trail standards (task.md Section 1).
 */
const SecurityEventTypes = Object.freeze({
  // Authentication events
  AUTH_LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGIN_FAILED: 'AUTH_LOGIN_FAILED',
  AUTH_LOGOUT: 'AUTH_LOGOUT',

  // Credential & lifecycle events
  PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  MFA_SUCCESS: 'MFA_SUCCESS',
  MFA_FAILED: 'MFA_FAILED',

  // User management events
  USER_CREATED: 'USER_CREATED',
  USER_DELETED: 'USER_DELETED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  PERMISSION_CHANGED: 'PERMISSION_CHANGED',

  // Access & administrative events
  API_ACCESS: 'API_ACCESS',
  ADMIN_ACCESS: 'ADMIN_ACCESS',

  // Data governance & privacy events
  DATA_CREATED: 'DATA_CREATED',
  DATA_UPDATED: 'DATA_UPDATED',
  DATA_DELETED: 'DATA_DELETED',
  DATA_EXPORTED: 'DATA_EXPORTED',

  // File operations
  FILE_UPLOADED: 'FILE_UPLOADED',
  FILE_DOWNLOADED: 'FILE_DOWNLOADED',

  // API key operations
  API_KEY_CREATED: 'API_KEY_CREATED',
  API_KEY_REVOKED: 'API_KEY_REVOKED',

  // System & database anomalies
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',

  // Threat & security detection
  SUSPICIOUS_REQUEST: 'SUSPICIOUS_REQUEST',
  RATE_LIMIT_TRIGGERED: 'RATE_LIMIT_TRIGGERED',
  SECURITY_ALERT: 'SECURITY_ALERT',
  AUTH_BRUTE_FORCE_ALERT: 'AUTH_BRUTE_FORCE_ALERT',

  // Compliance & archival
  LOGS_ARCHIVED: 'LOGS_ARCHIVED',
  CONFIG_CHANGED: 'CONFIG_CHANGED',
});

module.exports = SecurityEventTypes;
