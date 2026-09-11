const https = require('https');

/**
 * Returns configured MSG91 credentials and default identifiers from environment variables.
 */
function getMsg91Config() {
  const authKey = (process.env.MSG91_AUTH_KEY || '').trim();
  const senderId = (process.env.MSG91_SENDER_ID || 'RAPIQR').trim();
  const smsFlowId = (process.env.MSG91_SMS_FLOW_ID || '').trim();
  const otpTemplateId = (process.env.MSG91_OTP_TEMPLATE_ID || '').trim();
  const whatsappIntegratedNumber = (process.env.MSG91_WHATSAPP_INTEGRATED_NUMBER || '').trim();
  const whatsappTemplateName = (process.env.MSG91_WHATSAPP_TEMPLATE_NAME || '').trim();

  return {
    authKey,
    senderId,
    smsFlowId,
    otpTemplateId,
    whatsappIntegratedNumber,
    whatsappTemplateName,
    isConfigured: Boolean(authKey),
  };
}

/**
 * Sanitizes phone numbers into standard digits expected by MSG91.
 * If 10 digits without country code, prepends "91" (India).
 *
 * @param {string} phone
 * @returns {string}
 */
function formatRecipientMobile(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

/**
 * Generic HTTPS request helper for MSG91 REST API endpoints.
 *
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method
 * @param {string} apiPath
 * @param {object|string|null} payload
 * @param {object} customHeaders
 * @returns {Promise<{ status: number, body: any }>}
 */
function callMsg91Api(method, apiPath, payload = null, customHeaders = {}) {
  const { authKey } = getMsg91Config();
  return new Promise((resolve, reject) => {
    const headers = {
      authkey: authKey,
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    let dataString = null;
    if (payload && (method === 'POST' || method === 'PUT')) {
      dataString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      headers['Content-Length'] = Buffer.byteLength(dataString);
    }

    const requestOptions = {
      hostname: 'control.msg91.com',
      port: 443,
      path: apiPath,
      method,
      headers,
    };

    const req = https.request(requestOptions, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: responseBody });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (dataString) {
      req.write(dataString);
    }
    req.end();
  });
}

/**
 * Turn an MSG91 API response into a human-readable error, mapping the common
 * API Security (418) and auth (401) rejections to actionable messages.
 */
function msg91ErrorText(response) {
  const body = response && response.body;
  if (!body) return '';
  if (typeof body === 'string') return body;
  if (body.apiError === '418') {
    return 'MSG91 API Security (418): server IP is not whitelisted for this auth key — add it in MSG91 dashboard → Authkey → API Security, or disable the toggle';
  }
  if (String(body.code) === '401' || body.apiError === '401') {
    return 'MSG91 Unauthorized (401): MSG91_AUTH_KEY was rejected or has no WhatsApp access';
  }
  return (
    body.message ||
    body.error ||
    (typeof body.errors === 'string'
      ? body.errors
      : Array.isArray(body.errors)
      ? body.errors.map((e) => e?.message || JSON.stringify(e)).join('; ')
      : '') ||
    ''
  );
}

/**
 * Dispatches transactional SMS via MSG91 Flow API.
 * Flow API is standard for DLT-compliant transactional and promotional SMS in India.
 *
 * @param {{ to: string, flowId?: string, variables?: Record<string, any>, body?: string }} params
 * @returns {Promise<{ success: boolean, simulated: boolean, statusCode?: number, response?: any, messageId?: string|null, error?: string|null, reason?: string }>}
 */
async function sendMsg91FlowSms({ to, flowId, variables = {}, body = '' }) {
  const config = getMsg91Config();
  const recipient = formatRecipientMobile(to);
  const targetFlowId = (flowId || config.smsFlowId || '').trim();

  if (!config.authKey) {
    return { success: false, simulated: true, reason: 'MSG91_AUTH_KEY not set in Server/.env' };
  }
  if (!recipient) {
    return { success: false, simulated: false, error: 'Recipient phone number is invalid or empty' };
  }
  if (!targetFlowId) {
    return { success: false, simulated: false, error: 'MSG91 Flow ID (template_id) is not configured' };
  }

  const payload = {
    template_id: targetFlowId,
    sender: config.senderId,
    short_url: '0',
    recipients: [
      {
        mobiles: recipient,
        message: body,
        ...variables,
      },
    ],
  };

  const response = await callMsg91Api('POST', '/api/v5/flow/', payload);
  const isOk = response.status >= 200 && response.status < 300 && response.body?.type !== 'error';

  return {
    success: isOk,
    simulated: false,
    statusCode: response.status,
    response: response.body,
    messageId: response.body?.message || response.body?.request_id || null,
    error: isOk ? null : (response.body?.message || response.body?.error || 'MSG91 Flow SMS failed'),
  };
}

/**
 * Sends OTP via MSG91 Dedicated OTP API.
 *
 * @param {{ mobile: string, templateId?: string, otp?: string|number, extraVars?: Record<string, any> }} params
 * @returns {Promise<{ success: boolean, simulated: boolean, statusCode?: number, response?: any, messageId?: string|null, error?: string|null, reason?: string }>}
 */
async function sendMsg91Otp({ mobile, templateId, otp, extraVars = {} }) {
  const config = getMsg91Config();
  const recipient = formatRecipientMobile(mobile);
  const targetTemplateId = (templateId || config.otpTemplateId || '').trim();

  if (!config.authKey) {
    return { success: false, simulated: true, reason: 'MSG91_AUTH_KEY not set in Server/.env' };
  }
  if (!recipient) {
    return { success: false, simulated: false, error: 'Mobile number is required' };
  }

  const queryParams = new URLSearchParams({
    mobile: recipient,
    authkey: config.authKey,
  });

  if (targetTemplateId) queryParams.set('template_id', targetTemplateId);
  if (otp) queryParams.set('otp', String(otp));

  const apiPath = `/api/v5/otp?${queryParams.toString()}`;
  const response = await callMsg91Api('POST', apiPath, extraVars);
  const isOk = response.status >= 200 && response.status < 300 && response.body?.type !== 'error';

  return {
    success: isOk,
    simulated: false,
    statusCode: response.status,
    response: response.body,
    messageId: response.body?.request_id || null,
    error: isOk ? null : (response.body?.message || 'MSG91 OTP send failed'),
  };
}

/**
 * Verifies OTP via MSG91 OTP Verify API.
 *
 * @param {{ mobile: string, otp: string|number }} params
 * @returns {Promise<{ success: boolean, simulated: boolean, response?: any, error?: string|null, reason?: string }>}
 */
async function verifyMsg91Otp({ mobile, otp }) {
  const config = getMsg91Config();
  const recipient = formatRecipientMobile(mobile);

  if (!config.authKey) {
    return { success: false, simulated: true, reason: 'MSG91_AUTH_KEY not set in Server/.env' };
  }

  const queryParams = new URLSearchParams({
    mobile: recipient,
    otp: String(otp).trim(),
    authkey: config.authKey,
  });

  const apiPath = `/api/v5/otp/verify?${queryParams.toString()}`;
  const response = await callMsg91Api('GET', apiPath);
  const isOk =
    response.status >= 200 &&
    response.status < 300 &&
    (response.body?.type === 'success' || response.body?.message === 'OTP verified success');

  return {
    success: isOk,
    simulated: false,
    response: response.body,
    error: isOk ? null : (response.body?.message || 'Invalid or expired OTP'),
  };
}

/**
 * Builds the components mapping required by MSG91 WhatsApp Outbound Bulk Template API.
 * Supports arrays of parameters, explicit key-value mappings, and plain text fallbacks.
 *
 * @param {{ variables?: Record<string, any>, components?: Record<string, any>, body?: string, headerMediaUrl?: string }} params
 * @returns {Record<string, { type: string, value: string }>}
 */
function buildMsg91WhatsAppComponents({ variables = {}, components = {}, body = '', headerMediaUrl = '' } = {}) {
  const result = {};

  // 1. If pre-structured components object is provided, normalize each field
  if (components && typeof components === 'object' && Object.keys(components).length > 0) {
    for (const [key, val] of Object.entries(components)) {
      if (val && typeof val === 'object' && val.value !== undefined) {
        result[key] = { type: val.type || 'text', value: String(val.value) };
      } else if (val !== undefined && val !== null) {
        result[key] = { type: 'text', value: String(val) };
      }
    }
  }

  // 2. Named variables map directly to named MSG91 body components.
  if (variables && typeof variables === 'object' && Object.keys(variables).length > 0) {
    // Keys are template variable names, e.g. { label: 'Car', link: 'https://...' }.
    for (const [key, val] of Object.entries(variables)) {
      const formattedKey = key.startsWith('body_') || key.startsWith('header_') || key.startsWith('button_')
        ? key
        : /^\d+$/.test(key)
        ? `body_${key}`
        : `body_${key}`;

      if (!result[formattedKey]) {
        result[formattedKey] = { type: 'text', value: String(val) };
      }
    }
  }

  // 3. Fallback to body text if no body components were generated
  const hasBodyComponent = Object.keys(result).some((k) => k.startsWith('body_'));
  if (!hasBodyComponent && body) {
    result.body_1 = { type: 'text', value: String(body) };
  }

  // 4. Header media attachment (image / document / video) if specified
  if (headerMediaUrl && !result.header_1) {
    result.header_1 = { type: 'image', value: String(headerMediaUrl) };
  }

  return result;
}

/**
 * Dispatches WhatsApp Message via MSG91 Outbound WhatsApp Template API (V5 bulk endpoint).
 *
 * @param {{ to: string|string[], templateName?: string, integratedNumber?: string, variables?: Record<string, any>, components?: Record<string, any>, body?: string, languageCode?: string, headerMediaUrl?: string }} params
 * @returns {Promise<{ success: boolean, simulated: boolean, statusCode?: number, response?: any, messageId?: string|null, error?: string|null, reason?: string }>}
 */
async function sendMsg91WhatsApp({
  to,
  templateName,
  integratedNumber,
  variables = [],
  components = {},
  body = '',
  languageCode = 'en',
  headerMediaUrl = '',
}) {
  const config = getMsg91Config();
  const senderNumber = (integratedNumber || config.whatsappIntegratedNumber || '').trim();
  const targetTemplate = (templateName || config.whatsappTemplateName || '').trim();

  // Normalize recipient numbers into international format array
  const rawList = Array.isArray(to) ? to : [to];
  const recipientList = rawList.map((num) => formatRecipientMobile(num)).filter(Boolean);

  if (!config.authKey) {
    return { success: false, simulated: true, reason: 'MSG91_AUTH_KEY not set in Server/.env' };
  }
  if (!senderNumber) {
    return { success: false, simulated: false, error: 'MSG91_WHATSAPP_INTEGRATED_NUMBER is not configured' };
  }
  if (recipientList.length === 0) {
    return { success: false, simulated: false, error: 'Recipient phone number is invalid or empty' };
  }
  if (!targetTemplate) {
    return { success: false, simulated: false, error: 'MSG91_WHATSAPP_TEMPLATE_NAME is not configured' };
  }

  const formattedComponents = buildMsg91WhatsAppComponents({ variables, components, body, headerMediaUrl });

  const payload = {
    integrated_number: senderNumber,
    content_type: 'template',
    payload: {
      type: 'template',
      template: {
        name: targetTemplate,
        language: {
          code: languageCode,
          policy: 'deterministic',
        },
        to_and_components: [
          {
            to: recipientList,
            components: formattedComponents,
          },
        ],
      },
    },
  };

  const response = await callMsg91Api('POST', '/api/v5/whatsapp/whatsapp-outbound-message/bulk/', payload);
  const isOk =
    response.status >= 200 &&
    response.status < 300 &&
    response.body?.status !== 'error' &&
    response.body?.type !== 'error';

  const messageId =
    response.body?.request_id ||
    response.body?.message_id ||
    (Array.isArray(response.body?.data) ? response.body.data[0]?.message_id : null) ||
    null;

  const errorMessage = isOk ? null : msg91ErrorText(response) || 'MSG91 WhatsApp send failed';

  return {
    success: isOk,
    simulated: false,
    statusCode: response.status,
    response: response.body,
    messageId,
    error: errorMessage,
  };
}

/**
 * Dispatches a session (within 24 hours of customer interaction) text message via MSG91 WhatsApp.
 *
 * @param {{ to: string, text: string, integratedNumber?: string }} params
 * @returns {Promise<{ success: boolean, simulated: boolean, statusCode?: number, response?: any, messageId?: string|null, error?: string|null, reason?: string }>}
 */
async function sendMsg91SessionWhatsApp({ to, text, integratedNumber }) {
  const config = getMsg91Config();
  const recipient = formatRecipientMobile(to);
  const senderNumber = (integratedNumber || config.whatsappIntegratedNumber || '').trim();

  if (!config.authKey) {
    return { success: false, simulated: true, reason: 'MSG91_AUTH_KEY not set in Server/.env' };
  }
  if (!senderNumber) {
    return { success: false, simulated: false, error: 'MSG91_WHATSAPP_INTEGRATED_NUMBER is not configured' };
  }
  if (!recipient) {
    return { success: false, simulated: false, error: 'Recipient phone number is invalid or empty' };
  }

  const payload = {
    integrated_number: senderNumber,
    content_type: 'text',
    payload: {
      to: recipient,
      text: String(text || ''),
    },
  };

  const response = await callMsg91Api('POST', '/api/v5/whatsapp/whatsapp-outbound-message/', payload);
  const isOk =
    response.status >= 200 &&
    response.status < 300 &&
    response.body?.status !== 'error' &&
    response.body?.type !== 'error';

  const messageId = response.body?.request_id || response.body?.message_id || null;
  const errorMessage = isOk ? null : msg91ErrorText(response) || 'MSG91 WhatsApp session message failed';

  return {
    success: isOk,
    simulated: false,
    statusCode: response.status,
    response: response.body,
    messageId,
    error: errorMessage,
  };
}

module.exports = {
  getMsg91Config,
  formatRecipientMobile,
  callMsg91Api,
  sendMsg91FlowSms,
  sendMsg91Otp,
  verifyMsg91Otp,
  buildMsg91WhatsAppComponents,
  sendMsg91WhatsApp,
  sendMsg91SessionWhatsApp,
};
