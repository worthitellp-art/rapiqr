/**
 * WhatsApp & MSG91 Structured Error Catalog
 * 
 * Provides end-to-end failure point classification across:
 * - App / Backend (Payload, missing config, internal debounce, template validation)
 * - MSG91 Gateway (Authentication, IP whitelist 418, credits, HTTP 4xx/5xx, timeouts)
 * - Meta / WhatsApp (Template approval, 24h session window, number not registered)
 * - Recipient Phone (Invalid digits, missing phone, unformatted input)
 * - Network (DNS failure, connection refusal, socket hangup)
 */

const WHATSAPP_ERROR_CODES = {
  // 1. API Request & Network
  NETWORK_CONNECTION_FAILED: 'NETWORK_CONNECTION_FAILED',
  GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT',
  
  // 2. Authentication & Security
  MSG91_AUTH_KEY_INVALID: 'MSG91_AUTH_KEY_INVALID',
  MSG91_AUTH_KEY_MISSING: 'MSG91_AUTH_KEY_MISSING',
  MSG91_IP_NOT_WHITELISTED: 'MSG91_IP_NOT_WHITELISTED',
  MSG91_NUMBER_NOT_INTEGRATED: 'MSG91_NUMBER_NOT_INTEGRATED',

  // 3. Template Validation
  TEMPLATE_NOT_CONFIGURED: 'TEMPLATE_NOT_CONFIGURED',
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  TEMPLATE_PARAM_MISMATCH: 'TEMPLATE_PARAM_MISMATCH',
  TEMPLATE_REJECTED_BY_META: 'TEMPLATE_REJECTED_BY_META',

  // 4. Recipient Number
  NO_RECIPIENT_PHONE: 'NO_RECIPIENT_PHONE',
  INVALID_RECIPIENT_PHONE: 'INVALID_RECIPIENT_PHONE',
  RECIPIENT_NOT_ON_WHATSAPP: 'RECIPIENT_NOT_ON_WHATSAPP',

  // 5. Payload & Content
  PAYLOAD_INVALID_NEWLINES: 'PAYLOAD_INVALID_NEWLINES',
  PAYLOAD_TEXT_TOO_LONG: 'PAYLOAD_TEXT_TOO_LONG',
  PAYLOAD_INVALID_JSON: 'PAYLOAD_INVALID_JSON',

  // 6. MSG91 Response & Processing
  MSG91_API_ERROR: 'MSG91_API_ERROR',
  MSG91_MALFORMED_RESPONSE: 'MSG91_MALFORMED_RESPONSE',

  // 7. HTTP Status Failures
  HTTP_BAD_REQUEST: 'HTTP_BAD_REQUEST',
  HTTP_FORBIDDEN: 'HTTP_FORBIDDEN',
  HTTP_NOT_FOUND: 'HTTP_NOT_FOUND',
  HTTP_SERVER_ERROR: 'HTTP_SERVER_ERROR',

  // 8. Rate Limits & Cooldowns
  RATE_LIMIT_DEBOUNCE: 'RATE_LIMIT_DEBOUNCE',
  RATE_LIMIT_DUPLICATE: 'RATE_LIMIT_DUPLICATE',
  RATE_LIMIT_THREAD_COOLDOWN: 'RATE_LIMIT_THREAD_COOLDOWN',
  RATE_LIMIT_MONTHLY_QUOTA: 'RATE_LIMIT_MONTHLY_QUOTA',
  MSG91_RATE_LIMIT_EXCEEDED: 'MSG91_RATE_LIMIT_EXCEEDED',

  // 9. Credits & Billing
  MSG91_INSUFFICIENT_CREDITS: 'MSG91_INSUFFICIENT_CREDITS',

  // 10. Provider Rejection & WhatsApp Policies
  PROVIDER_SESSION_WINDOW_EXPIRED: 'PROVIDER_SESSION_WINDOW_EXPIRED',
  PROVIDER_ACCOUNT_RESTRICTED: 'PROVIDER_ACCOUNT_RESTRICTED',
  PROVIDER_REJECTED: 'PROVIDER_REJECTED',
};

/**
 * Builds a standardized, structured error object.
 *
 * @param {object} params
 * @param {string} params.code Standard error code from WHATSAPP_ERROR_CODES
 * @param {'app'|'msg91'|'meta'|'client'|'network'} params.source Which system originated the failure
 * @param {string} params.whatFailed Clear description of what operation failed
 * @param {string} params.whyFailed The exact reason behind the failure
 * @param {string} params.safeNextAction Actionable, user-safe instructions
 * @param {number} [params.retryAfterSec] Optional cooldown seconds
 * @param {object} [params.technicalDetails] Developer-level raw diagnostics (MSG91 response, codes, traces)
 * @returns {object} Standardized WhatsApp error response
 */
function createWhatsAppError({
  code,
  source = 'app',
  whatFailed,
  whyFailed,
  safeNextAction,
  retryAfterSec = null,
  technicalDetails = {},
}) {
  const sourceLabels = {
    app: 'RepiQR Application / Backend',
    msg91: 'MSG91 WhatsApp Gateway',
    meta: 'Meta / WhatsApp Business Network',
    client: 'Recipient / Input Data',
    network: 'Internet / Gateway Connectivity',
  };

  return {
    success: false,
    error: {
      code,
      source,
      sourceLabel: sourceLabels[source] || source,
      whatFailed,
      whyFailed,
      safeNextAction,
      retryAfterSec,
      technicalDetails: {
        timestamp: new Date().toISOString(),
        originalError: technicalDetails.originalError || null,
        originalCode: technicalDetails.originalCode || null,
        statusCode: technicalDetails.statusCode || null,
        requestId: technicalDetails.requestId || null,
        endpoint: technicalDetails.endpoint || null,
        rawResponse: technicalDetails.rawResponse || null,
      },
    },
  };
}

/**
 * Classifies any MSG91 HTTP response or client error into our structured error format.
 *
 * @param {{ status?: number, body?: any, error?: Error|string, payload?: any, endpoint?: string }} context
 * @returns {object} Standard structured WhatsApp error
 */
function classifyMsg91Failure({ status, body, error, payload, endpoint }) {
  const statusCode = status || (body && (body.code || body.status_code)) || null;
  const rawBody = typeof body === 'object' ? body : { raw: body };
  const rawMsg = String(
    (body && (body.message || body.error || body.errors || body.data)) ||
    (error && error.message) ||
    ''
  ).toLowerCase();

  const originalCode = body?.code || body?.apiError || body?.error_code || null;
  const requestId = body?.request_id || body?.message_id || null;

  const techDetails = {
    statusCode,
    originalCode,
    requestId,
    endpoint,
    rawResponse: body || error?.message,
    originalError: error?.message || (typeof body === 'string' ? body : JSON.stringify(body)),
  };

  // 1. Network & Timeout
  if (error) {
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout') || error.message?.includes('timed out')) {
      return createWhatsAppError({
        code: WHATSAPP_ERROR_CODES.GATEWAY_TIMEOUT,
        source: 'network',
        whatFailed: 'WhatsApp gateway request timed out',
        whyFailed: 'MSG91 servers did not respond within the 10-second timeout window.',
        safeNextAction: 'The server will retry in the background. You can reach the vehicle owner immediately using in-app chat.',
        technicalDetails: techDetails,
      });
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      return createWhatsAppError({
        code: WHATSAPP_ERROR_CODES.NETWORK_CONNECTION_FAILED,
        source: 'network',
        whatFailed: 'Could not connect to MSG91 messaging service',
        whyFailed: `Backend network error: ${error.code} (${error.message}). MSG91 domain could not be reached.`,
        safeNextAction: 'Check your server internet connection or DNS. In-app chat and dashboard alerts remain fully functional.',
        technicalDetails: techDetails,
      });
    }
  }

  // 2. Authentication & IP Security (418 / 401)
  if (body?.apiError === '418' || rawMsg.includes('whitelist') || rawMsg.includes('api security') || statusCode === 418) {
    return createWhatsAppError({
      code: WHATSAPP_ERROR_CODES.MSG91_IP_NOT_WHITELISTED,
      source: 'msg91',
      whatFailed: 'MSG91 API Security blocked request (IP 418)',
      whyFailed: 'The server IP is not whitelisted for this MSG91 Auth Key in the MSG91 dashboard.',
      safeNextAction: 'Admin action required: Go to MSG91 Dashboard → Authkey → API Security and whitelist the server IP, or toggle off IP restriction.',
      technicalDetails: techDetails,
    });
  }

  if (statusCode === 401 || originalCode === '401' || body?.apiError === '201' || rawMsg.includes('unauthorized') || rawMsg.includes('invalid authkey')) {
    return createWhatsAppError({
      code: WHATSAPP_ERROR_CODES.MSG91_AUTH_KEY_INVALID,
      source: 'msg91',
      whatFailed: 'MSG91 authentication rejected (401)',
      whyFailed: 'The configured MSG91_AUTH_KEY was rejected by MSG91 or does not have WhatsApp API permissions enabled.',
      safeNextAction: 'Admin action required: Verify MSG91_AUTH_KEY in Server/.env and ensure WhatsApp permission is assigned to this key.',
      technicalDetails: techDetails,
    });
  }

  // 3. Sender Number Not Integrated (404 / 'not integrated')
  if (statusCode === 404 || rawMsg.includes('whatsapp not integrated') || rawMsg.includes('not integrated')) {
    return createWhatsAppError({
      code: WHATSAPP_ERROR_CODES.MSG91_NUMBER_NOT_INTEGRATED,
      source: 'msg91',
      whatFailed: 'WhatsApp sender number not integrated',
      whyFailed: `MSG91 reported that the sender phone number (${payload?.integrated_number || 'configured'}) is not an approved integrated WhatsApp number.`,
      safeNextAction: 'Admin action required: Verify MSG91_WHATSAPP_INTEGRATED_NUMBER in Server/.env matches the active number in your MSG91 WhatsApp console.',
      technicalDetails: techDetails,
    });
  }

  // 4. Credits / Balance Exhausted
  if (
    rawMsg.includes('credit') ||
    rawMsg.includes('balance') ||
    rawMsg.includes('insufficient') ||
    statusCode === 402 ||
    rawMsg.includes('payment required')
  ) {
    return createWhatsAppError({
      code: WHATSAPP_ERROR_CODES.MSG91_INSUFFICIENT_CREDITS,
      source: 'msg91',
      whatFailed: 'MSG91 WhatsApp credits depleted',
      whyFailed: 'Your MSG91 account does not have sufficient WhatsApp balance or wallet credits to dispatch this message.',
      safeNextAction: 'Admin action required: Recharge WhatsApp message credits in MSG91 dashboard. Tag alerts remain safely stored in the database.',
      technicalDetails: techDetails,
    });
  }

  // 5. Rate Limits & Quotas (429)
  if (statusCode === 429 || rawMsg.includes('too many') || rawMsg.includes('rate limit')) {
    return createWhatsAppError({
      code: WHATSAPP_ERROR_CODES.MSG91_RATE_LIMIT_EXCEEDED,
      source: 'msg91',
      whatFailed: 'WhatsApp provider rate limit exceeded (429)',
      whyFailed: 'MSG91 or Meta rate limit reached for outbound messages on this account.',
      safeNextAction: 'Please pause for 60 seconds before trying again. Alerts are already stored in the owner’s inbox.',
      retryAfterSec: 60,
      technicalDetails: techDetails,
    });
  }

  // 6. Template Validation Errors (Variable mismatch, unapproved template)
  if (
    rawMsg.includes('template') ||
    rawMsg.includes('param') ||
    rawMsg.includes('localizable') ||
    rawMsg.includes('components') ||
    rawMsg.includes('language')
  ) {
    return createWhatsAppError({
      code: WHATSAPP_ERROR_CODES.TEMPLATE_PARAM_MISMATCH,
      source: 'msg91',
      whatFailed: 'WhatsApp template parameters or template approval mismatch',
      whyFailed: `MSG91 rejected the template structure: ${rawMsg}. Ensure template name, locale (en), and variable placeholders match approved Meta definitions.`,
      safeNextAction: 'Admin action required: Check MSG91 Dashboard → WhatsApp → Templates and confirm template status and variable parameters.',
      technicalDetails: techDetails,
    });
  }

  // 7. Recipient Phone Number Errors
  if (
    rawMsg.includes('recipient') ||
    rawMsg.includes('mobile') ||
    rawMsg.includes('invalid number') ||
    rawMsg.includes('not a whatsapp') ||
    rawMsg.includes('phone')
  ) {
    return createWhatsAppError({
      code: WHATSAPP_ERROR_CODES.INVALID_RECIPIENT_PHONE,
      source: 'client',
      whatFailed: 'Recipient mobile number rejected by WhatsApp',
      whyFailed: `MSG91 rejected the recipient phone format: ${rawMsg}. The number might be inactive or not registered on WhatsApp.`,
      safeNextAction: 'Please verify the recipient phone number in the tag settings. Use in-app RepiChat as a direct alternative.',
      technicalDetails: techDetails,
    });
  }

  // 8. 24h Customer Service Window Expired
  if (rawMsg.includes('24 hour') || rawMsg.includes('session window') || rawMsg.includes('conversation window')) {
    return createWhatsAppError({
      code: WHATSAPP_ERROR_CODES.PROVIDER_SESSION_WINDOW_EXPIRED,
      source: 'meta',
      whatFailed: 'WhatsApp 24-hour conversation window expired',
      whyFailed: 'Meta requires approved templates to open a conversation if more than 24 hours have elapsed since the user last contacted the business.',
      safeNextAction: 'A pre-approved template message will be used to reopen the conversation.',
      technicalDetails: techDetails,
    });
  }

  // 9. HTTP 5xx Server Errors
  if (statusCode && statusCode >= 500) {
    return createWhatsAppError({
      code: WHATSAPP_ERROR_CODES.HTTP_SERVER_ERROR,
      source: 'msg91',
      whatFailed: `MSG91 gateway server error (HTTP ${statusCode})`,
      whyFailed: `MSG91 servers encountered an internal error while processing the WhatsApp request: ${rawMsg || 'Internal server error'}`,
      safeNextAction: 'MSG91 is currently experiencing upstream instability. The alert is saved in our system; try again in a few minutes.',
      technicalDetails: techDetails,
    });
  }

  // 10. General MSG91 API Failure
  return createWhatsAppError({
    code: WHATSAPP_ERROR_CODES.MSG91_API_ERROR,
    source: 'msg91',
    whatFailed: `MSG91 WhatsApp send failed${statusCode ? ` (HTTP ${statusCode})` : ''}`,
    whyFailed: rawMsg || 'MSG91 rejected the WhatsApp outbound dispatch.',
    safeNextAction: 'Check developer logs for the original MSG91 error payload. You can message the owner directly using in-app chat.',
    technicalDetails: techDetails,
  });
}

module.exports = {
  WHATSAPP_ERROR_CODES,
  createWhatsAppError,
  classifyMsg91Failure,
};
