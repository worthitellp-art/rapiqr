/**
 * Notification message catalogue.
 *
 * One place that owns WHAT we say, kept out of React components and out of the
 * controllers that decide WHEN to say it. Each entry maps a RepiQR event type to
 * the WhatsApp template it will use once templates are approved, plus a plain
 * text body used by the mock provider today and as the session-message fallback
 * later.
 *
 * The template definitions (names, ordered variables, and the {{n}} bodies you
 * submit to MSG91) live in `./msg91Templates` — the single source of truth.
 * This file only stitches them into the runtime catalogue:
 *
 *  - `templateName`  → MSG91 template name (as submitted for approval).
 *  - `variables`     → named values a WhatsApp template expects ({{label}},
 *                       {{message}}, ...) — kept in sync with what gets approved.
 *  - `build`         → plain-text render used by the mock provider and as the
 *                       session fallback; generated from the same MSG91 body so
 *                       the two can never drift apart.
 */

const {
  MSG91_TEMPLATES,
  renderBody,
  buildVariables: buildTemplateVariables,
} = require('./msg91Templates');

const TEMPLATES = Object.fromEntries(
  Object.entries(MSG91_TEMPLATES).map(([type, tpl]) => [
    type,
    {
      templateName: tpl.name,
      audience: tpl.audience,
      variables: tpl.variables,
      build: (data) => renderBody(type, data),
    },
  ]),
);

function getTemplate(type) {
  return TEMPLATES[type] || null;
}

/** Named variable map for the WhatsApp template. */
function buildVariables(type, data = {}) {
  return buildTemplateVariables(type, data);
}

/** Plain-text rendering — what the mock provider logs and what a session message sends. */
function buildBody(type, data = {}) {
  const template = getTemplate(type);
  if (!template) return '';
  return template.build(data);
}

module.exports = { TEMPLATES, getTemplate, buildVariables, buildBody, NOTIFICATION_TYPES: Object.keys(TEMPLATES) };