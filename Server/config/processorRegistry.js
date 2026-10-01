/**
 * Third-party data processor registry (task.md §14, §28). Mirrors
 * docs/DPDP_COMPLIANCE_AUDIT.md section 2 — update both together.
 *
 * DPA_STATUS values: CONFIRMED | REVIEW_REQUIRED | NOT_CONFIRMED. Everything
 * here starts REVIEW_REQUIRED/NOT_CONFIRMED deliberately — this file must
 * never assert a processor has a signed DPA unless that's actually true.
 */
const PROCESSORS = Object.freeze([
  { name: 'MSG91', purpose: 'OTP authentication, transactional SMS/WhatsApp, emergency alerts', dataShared: ['phone_number', 'otp_code', 'message_content'], region: 'India', dpaStatus: 'REVIEW_REQUIRED' },
  { name: 'Twilio', purpose: 'Masked call bridge (fallback), SMS/WhatsApp fallback', dataShared: ['phone_number', 'call_metadata'], region: 'Foreign (US)', dpaStatus: 'REVIEW_REQUIRED' },
  { name: 'Exotel', purpose: 'Masked call bridge', dataShared: ['phone_number'], region: 'India', dpaStatus: 'REVIEW_REQUIRED' },
  { name: 'Cloudshope', purpose: 'Masked DID minting', dataShared: ['phone_number'], region: 'India (presumed)', dpaStatus: 'REVIEW_REQUIRED' },
  { name: 'Shiprocket', purpose: 'Shipping fulfillment', dataShared: ['name', 'address', 'pincode', 'email', 'phone_number'], region: 'India', dpaStatus: 'REVIEW_REQUIRED' },
  { name: 'Razorpay', purpose: 'Payment processing', dataShared: ['name', 'email', 'phone_number', 'order_amount'], region: 'India', dpaStatus: 'REVIEW_REQUIRED' },
  { name: 'Resend', purpose: 'Transactional email', dataShared: ['email_address', 'email_content'], region: 'Foreign (US)', dpaStatus: 'REVIEW_REQUIRED' },
  { name: 'SMTP (deployer-configured)', purpose: 'Fallback transactional email', dataShared: ['email_address', 'email_content'], region: 'Depends on deployment', dpaStatus: 'REVIEW_REQUIRED' },
  { name: 'Google', purpose: 'OAuth login', dataShared: ['email', 'name', 'profile_photo'], region: 'Foreign (US)', dpaStatus: 'REVIEW_REQUIRED' },
  { name: 'api.bigdatacloud.net', purpose: 'Reverse-geocoding for the partner/JoinUs application form', dataShared: ['gps_coordinates'], region: 'Foreign (unconfirmed)', dpaStatus: 'NOT_CONFIRMED' },
  { name: 'Object storage (S3/R2/B2/MinIO — deployer-configured)', purpose: 'Chat image attachments, compliance log archives', dataShared: ['uploaded_files'], region: 'Depends on deployment', dpaStatus: 'REVIEW_REQUIRED' },
]);

module.exports = { PROCESSORS };
