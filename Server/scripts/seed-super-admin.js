#!/usr/bin/env node
/**
 * scripts/seed-super-admin.js
 * ───────────────────────────
 * Idempotent SUPER_ADMIN seeder.  Run with:
 *   node scripts/seed-super-admin.js
 *   npm run seed:superadmin   (after adding the script to package.json)
 *
 * What it does:
 *   1. Connects to MongoDB using MONGODB_URI from .env
 *   2. Seeds the four default RBAC roles (SUPER_ADMIN, ADMIN, MANAGER, USER)
 *   3. Checks if a SUPER_ADMIN user already exists — skips if so
 *   4. Reads SUPER_ADMIN_EMAIL from env (required)
 *   5. Uses SUPER_ADMIN_PASSWORD if set; otherwise generates a 32-char
 *      crypto-secure random password
 *   6. Hashes with bcrypt cost 12
 *   7. Creates the user with must_change_password = true
 *   8. Generates a TOTP secret + QR code path for MFA setup
 *   9. Writes SUPERADMIN_ACCESS.local.md (never overwrites if it exists)
 *  10. Sets file mode 600 on Unix / skips on Windows
 *  11. Appends entries to .gitignore if missing
 *  12. Prints a one-time terminal banner pointing to the file
 */

'use strict';

const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');
const os      = require('os');

// ─── Load env before requiring any model ──────────────────────────────────
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// We require schemas directly (not via server.js) so the seed script is
// self-contained and doesn't start sockets, CORS, etc.
const User = require('../models/schemas/User');
const Role = require('../models/schemas/Role');
const { PERMISSIONS, ROLE_DEFAULT_PERMISSIONS } = require('../utils/permissions');

// ─── Helpers ──────────────────────────────────────────────────────────────
function generatePassword(length = 32) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
  const bytes   = crypto.randomBytes(length * 2);
  let result = '';
  for (let i = 0; i < bytes.length && result.length < length; i++) {
    const idx = bytes[i] % charset.length;
    result += charset[idx];
  }
  return result;
}

function generateTotpSecret() {
  // 20 random bytes → base32 — compatible with google-authenticator
  const raw    = crypto.randomBytes(20);
  const base32 = raw.toString('base64')
    .replace(/\+/g, '7').replace(/\//g, '8').replace(/=/g, '')
    .toUpperCase()
    .slice(0, 32);
  return base32;
}

function buildOtpauthUrl(label, secret, issuer = 'RapiQR') {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

function ensureGitignore(rootDir, entries) {
  const gitignorePath = path.join(rootDir, '.gitignore');
  let content = '';
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf8');
  }
  const toAdd = entries.filter((e) => !content.includes(e));
  if (toAdd.length > 0) {
    fs.appendFileSync(gitignorePath, '\n# Super admin access file (auto-added)\n' + toAdd.join('\n') + '\n');
    console.log(`✅  Added to .gitignore: ${toAdd.join(', ')}`);
  }
}

// ─── Seed Roles ───────────────────────────────────────────────────────────
async function seedRoles() {
  const roles = [
    {
      name: 'SUPER_ADMIN',
      permissions: ROLE_DEFAULT_PERMISSIONS.SUPER_ADMIN,
      description: 'Full system access. Can manage all roles and permissions.',
      system: true,
    },
    {
      name: 'ADMIN',
      permissions: ROLE_DEFAULT_PERMISSIONS.ADMIN,
      description: 'Fleet & operations management. Cannot manage admins or change roles.',
      system: true,
    },
    {
      name: 'MANAGER',
      permissions: ROLE_DEFAULT_PERMISSIONS.MANAGER,
      description: 'Read-only plus limited create access for stickers/orders.',
      system: true,
    },
    {
      name: 'USER',
      permissions: ROLE_DEFAULT_PERMISSIONS.USER,
      description: 'Standard customer account. No admin panel access.',
      system: true,
    },
  ];

  for (const r of roles) {
    await Role.findOneAndUpdate(
      { name: r.name },
      { $set: r },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log('✅  RBAC roles seeded (SUPER_ADMIN, ADMIN, MANAGER, USER)');
}

// ─── Main seed ────────────────────────────────────────────────────────────
async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌  MONGODB_URI is not set. Add it to Server/.env');
    process.exit(1);
  }

  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  if (!superAdminEmail) {
    console.error('❌  SUPER_ADMIN_EMAIL is not set in your .env file.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
  console.log('✅  Connected to MongoDB');

  // Seed roles first (idempotent)
  await seedRoles();

  // Check if SUPER_ADMIN already exists
  const existing = await User.findOne({ role_name: 'SUPER_ADMIN' }).lean();
  if (existing) {
    console.log(`\nℹ️  SUPER_ADMIN already exists (${existing.email}). Seed skipped.\n`);
    await mongoose.disconnect();
    return;
  }

  // ─── Build credentials ────────────────────────────────────────────────
  const rawPassword   = (process.env.SUPER_ADMIN_PASSWORD || '').trim() || generatePassword(32);
  const passwordHash  = await bcrypt.hash(rawPassword, 12);
  const totpSecret    = generateTotpSecret();
  const otpauthUrl    = buildOtpauthUrl(superAdminEmail, totpSecret);
  const isGenPassword = !process.env.SUPER_ADMIN_PASSWORD;

  // ─── Create user ──────────────────────────────────────────────────────
  const doc = await User.create({
    email:               superAdminEmail,
    full_name:           'Super Admin',
    role:                'admin',
    role_name:           'SUPER_ADMIN',
    password_hash:       passwordHash,
    email_verified:      true,
    must_change_password: true,
    'metadata.twoFactor.secret': totpSecret,
    'metadata.twoFactor.enabled': false, // enabled after first TOTP verify
  });

  console.log(`✅  SUPER_ADMIN created: ${doc.email}  (id: ${doc._id})`);

  // ─── SUPERADMIN_ACCESS.local.md ───────────────────────────────────────
  const rootDir      = path.join(__dirname, '..', '..');
  const serverDir    = path.join(__dirname, '..');
  const accessFile   = path.join(rootDir, 'SUPERADMIN_ACCESS.local.md');
  const serverEnvDir = serverDir;

  // Detect the local app URL
  const port    = process.env.PORT || 5000;
  const appUrl  = process.env.APP_URL || `http://localhost:${port}`;
  const adminUrl = `${appUrl}/admin`;

  if (!fs.existsSync(accessFile)) {
    const qrNote = `Run: npx qrcode-terminal "${otpauthUrl}" to display as a QR in your terminal`;
    const content = [
      '# 🔐 SUPER ADMIN ACCESS — DELETE THIS FILE AFTER FIRST LOGIN',
      '',
      '> **WARNING:** This file contains sensitive credentials.',
      '> Delete it immediately after your first login.',
      '> File mode is set to 600 (owner read/write only).',
      '',
      '---',
      '',
      '## Login URL',
      `**Admin Panel:** ${adminUrl}`,
      `**Super Admin API:** ${appUrl}/api/super-admin/auth/login`,
      '',
      '## Credentials',
      `**Email:** \`${superAdminEmail}\``,
      isGenPassword
        ? `**Password (auto-generated):** \`${rawPassword}\``
        : '**Password:** *(as set in SUPER_ADMIN_PASSWORD env var)*',
      '',
      '## TOTP / MFA Setup',
      '```',
      `TOTP Secret: ${totpSecret}`,
      '```',
      '',
      `OTPAuth URL: \`${otpauthUrl}\``,
      '',
      qrNote,
      '',
      '**Apps that work:** Google Authenticator, Authy, 1Password, Bitwarden',
      '',
      '---',
      '',
      '## First Login Steps',
      '1. Navigate to the Admin Panel URL above',
      '2. Enter your email and the temporary password',
      '3. You will be prompted to **change your password** (must_change_password = true)',
      '4. After changing password, log in again',
      '5. You will be asked for a **TOTP code** — scan the OTPAuth URL with your authenticator app first',
      '6. Enter the 6-digit code from your authenticator app',
      '7. ✅ You now have a full SUPER_ADMIN session (15-min access token, 7-day rotating refresh)',
      '',
      '## Credential Rotation',
      '- **Password:** Use the admin panel → Profile → Change Password, or run:',
      '  `node Server/scripts/break-glass.js --reset-password`',
      '- **TOTP:** Re-run the seed with `SUPER_ADMIN_EMAIL=... node Server/scripts/seed-super-admin.js`',
      '  after removing the existing SUPER_ADMIN account (or use the break-glass CLI)',
      '',
      '---',
      `*Generated at: ${new Date().toISOString()}*`,
      '',
      '**⚠️  Delete this file now: `del SUPERADMIN_ACCESS.local.md` (Windows) or `rm SUPERADMIN_ACCESS.local.md` (Unix)**',
    ].join('\n');

    fs.writeFileSync(accessFile, content, { encoding: 'utf8' });

    // Set 600 permissions on Unix/Mac
    if (os.platform() !== 'win32') {
      try { fs.chmodSync(accessFile, 0o600); } catch { /* ignore on systems that don't support it */ }
    }
    console.log(`\n📄  Credentials written to: ${accessFile}`);
  } else {
    console.log(`\nℹ️  ${accessFile} already exists — not overwritten.`);
  }

  // ─── .gitignore entries ───────────────────────────────────────────────
  ensureGitignore(rootDir, [
    'SUPERADMIN_ACCESS.local.md',
    '.env',
    '.env.*',
    '!.env.example',
  ]);

  // ─── Terminal banner ──────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(62));
  console.log('  ✅  SUPER ADMIN SEEDED SUCCESSFULLY');
  console.log('═'.repeat(62));
  console.log(`  Email   : ${superAdminEmail}`);
  if (isGenPassword) {
    console.log(`  Password: ${rawPassword}  ← SAVE THIS NOW`);
  }
  console.log(`  TOTP    : ${totpSecret}`);
  console.log(`  File    : SUPERADMIN_ACCESS.local.md`);
  console.log('');
  console.log('  ⚠  Open SUPERADMIN_ACCESS.local.md, complete first login,');
  console.log('     then DELETE the file immediately.');
  console.log('═'.repeat(62) + '\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
