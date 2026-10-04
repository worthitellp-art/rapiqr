// Prints a bcrypt hash for the admin password. Paste the output into
// Server/.env as ADMIN_PASSWORD_HASH=... (the plain password is never stored).
//
// Usage:  node scripts/hashAdminPassword.js "<password, at least 12 characters>"

const { hashPassword } = require('../utils/passwords');

const password = process.argv[2] || '';
if (password.length < 12) {
  console.error('Usage: node scripts/hashAdminPassword.js "<password, at least 12 characters>"');
  process.exit(1);
}

hashPassword(password).then((hash) => {
  console.log(hash);
});
