#!/usr/bin/env node
/**
 * scripts/break-glass.js
 * ──────────────────────
 * Emergency break-glass CLI for SUPER_ADMIN credential reset.
 * Requires direct server/shell access (never exposed via HTTP).
 *
 * Usage:
 *   node Server/scripts/break-glass.js --reset-password
 *   node Server/scripts/break-glass.js --reset-totp
 *   node Server/scripts/break-glass.js --unlock
 *   node Server/scripts/break-glass.js --show-status
 *
 * Every action is written to the audit log.
 */

'use strict';

const path   = require('path');
const crypto = require('crypto');
const readline = require('readline');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/schemas/User');
const AuditLog = require('../models/schemas/AuditLog');

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
const action   = process.argv[2];

function generatePassword(length = 32) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
  const bytes   = crypto.randomBytes(length * 2);
  let result = '';
  for (let i = 0; i < bytes.length && result.length < length; i++) {
    result += charset[bytes[i] % charset.length];
  }
  return result;
}

function generateTotpSecret() {
  const raw = crypto.randomBytes(20);
  return raw.toString('base64')
    .replace(/\+/g, '7').replace(/\//g, '8').replace(/=/g, '')
    .toUpperCase().slice(0, 32);
}

function rl() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function ask(question) {
  return new Promise((resolve) => {
    const iface = rl();
    iface.question(question, (ans) => { iface.close(); resolve(ans.trim()); });
  });
}

async function auditBreakGlass(userId, action, metadata) {
  await AuditLog.create({
    event_type:   'BREAK_GLASS',
    actor_type:   'SUPER_ADMIN',
    user_id:      userId,
    method:       'CLI',
    endpoint:     `break-glass ${action}`,
    resource_type: 'SuperAdmin',
    reason:       'Emergency credential reset via break-glass CLI',
    metadata:     { action, ...metadata },
    created_at:   new Date(),
  });
}

async function main() {
  if (!mongoUri) {
    console.error('❌  MONGODB_URI not set.');
    process.exit(1);
  }
  if (!action) {
    console.log('Usage: node Server/scripts/break-glass.js [--reset-password|--reset-totp|--unlock|--show-status]');
    process.exit(0);
  }

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
  const admin = await User.findOne({ role_name: 'SUPER_ADMIN' })
    .select('+password_hash +locked_until +failed_login_count +metadata')
    .lean();

  if (!admin) {
    console.error('❌  No SUPER_ADMIN found. Run seed-super-admin.js first.');
    await mongoose.disconnect();
    process.exit(1);
  }

  switch (action) {
    case '--show-status': {
      console.log('\n── SUPER_ADMIN Status ──────────────────────────────');
      console.log(`  Email           : ${admin.email}`);
      console.log(`  Role            : ${admin.role_name}`);
      console.log(`  TOTP enabled    : ${admin.metadata?.twoFactor?.enabled}`);
      console.log(`  Must change pw  : ${admin.must_change_password}`);
      console.log(`  Locked until    : ${admin.locked_until || 'NOT LOCKED'}`);
      console.log(`  Failed attempts : ${admin.failed_login_count || 0}`);
      console.log('────────────────────────────────────────────────────\n');
      break;
    }

    case '--unlock': {
      const confirm = await ask(`Unlock SUPER_ADMIN account (${admin.email})? [yes/no]: `);
      if (confirm !== 'yes') { console.log('Aborted.'); break; }
      await User.updateOne(
        { _id: admin._id },
        { $set: { locked_until: null, failed_login_count: 0 } }
      );
      await auditBreakGlass(admin._id, 'unlock', { email: admin.email });
      console.log('✅  Account unlocked.');
      break;
    }

    case '--reset-password': {
      const confirm = await ask(`⚠️  Reset SUPER_ADMIN password for (${admin.email})? [yes/no]: `);
      if (confirm !== 'yes') { console.log('Aborted.'); break; }
      const newPw  = generatePassword(32);
      const hash   = await bcrypt.hash(newPw, 12);
      await User.updateOne(
        { _id: admin._id },
        { $set: { password_hash: hash, must_change_password: true, locked_until: null, failed_login_count: 0 } }
      );
      await auditBreakGlass(admin._id, 'reset_password', { email: admin.email });
      console.log('\n' + '═'.repeat(56));
      console.log('  ✅  SUPER_ADMIN PASSWORD RESET');
      console.log('═'.repeat(56));
      console.log(`  New password : ${newPw}`);
      console.log('  must_change_password = true (forced reset on next login)');
      console.log('  ⚠  Save this password NOW — it will not be shown again.');
      console.log('═'.repeat(56) + '\n');
      break;
    }

    case '--reset-totp': {
      const confirm = await ask(`⚠️  Reset SUPER_ADMIN TOTP for (${admin.email})? [yes/no]: `);
      if (confirm !== 'yes') { console.log('Aborted.'); break; }
      const secret   = generateTotpSecret();
      const issuer   = 'RapiQR';
      const otpUrl   = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(admin.email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
      await User.updateOne(
        { _id: admin._id },
        {
          $set: {
            'metadata.twoFactor.secret':  secret,
            'metadata.twoFactor.enabled': false,
          },
        }
      );
      await auditBreakGlass(admin._id, 'reset_totp', { email: admin.email });
      console.log('\n' + '═'.repeat(56));
      console.log('  ✅  SUPER_ADMIN TOTP RESET');
      console.log('═'.repeat(56));
      console.log(`  New TOTP secret : ${secret}`);
      console.log(`  OTPAuth URL     : ${otpUrl}`);
      console.log('  Scan with Google Authenticator / Authy / 1Password');
      console.log('  ⚠  Save this secret NOW — it will not be shown again.');
      console.log('═'.repeat(56) + '\n');
      break;
    }

    default:
      console.log(`Unknown action: ${action}`);
      console.log('Valid: --reset-password, --reset-totp, --unlock, --show-status');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌  Break-glass failed:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
