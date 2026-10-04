super admin :- 


Act as a Senior Cybersecurity Architect and Full-Stack Engineer. I need you to write the backend code and database schema to implement a "Super Admin" role for my web application. 

The application uses Email and Password for authentication. I want this system hardened against hackers using industry-standard security practices.

Please provide the code and logic for the following 4 components:

1. DATABASE SCHEMA
Create a users table/schema that includes fields for:
- Standard user details (Id, email, hashed_password)
- A role field (Enum: 'user', 'admin', 'super_admin')
- Security columns: multi_factor_secret, last_login_ip, account_locked_until, login_attempts, and a unique backup_recovery_code.

2. SECURE REGISTRATION & SEEDING SCRIPT
Write a script or backend function to safely seed/create the initial Super Admin. 
- Ensure it enforces a strong password policy (minimum 16 characters, checks for complexity).
- Include standard password hashing logic using Argon2id or bcrypt.

3. HARDENED LOGIN LOGIC & MIDDLEWARE
Write the authentication and authorization backend logic for logging in. It must include:
- Brute-force protection: Lock the account for 15 minutes after 5 failed login attempts.
- An "IsSuperAdmin" middleware/decorator to restrict access to sensitive management routes.
- IP logging to track where the Super Admin is accessing the system from.

4. DUAL-AUTHORIZATION TRIGGER (SECURITY BONUS)
Include a mechanism or middleware that sends a mock security alert (e.g., logging a critical warning or triggering a webhook notification) the exact second a 'super_admin' successfully logs in, so the team is immediately aware.

Please write this using [INSERT YOUR CHOSEN LANGUAGE/FRAMEWORK HERE, e.g., Node.js with Express and PostgreSQL, or Python with FastAPI and SQLAlchemy]. Keep the code clean, fully commented, and production-ready.





Role: Senior Full-Stack Security Engineer working directly on the existing RepiQR codebase.

Objective: Perform a production security and UI cleanup pass without redesigning the app or altering business logic. Inspect the architecture first, implement changes cleanly within the existing setup, and maintain full app functionality (QR scanning, routing, activation, recovery, auth, dashboard, emergency flows, Workers SPA routing).

TASKS:

1. Hide Sensitive Data & Secrets:
   - Remove activation/recovery codes, hashes, secrets, and internal database IDs from user-facing screens, API responses, client state, localStorage/sessionStorage, URLs, and console logs.
   - Keep only minimum required data per screen without breaking sticker activation, recovery, or management.

2. Secure Third-Party APIs & Credentials:
   - Audit all external frontend API calls. Move all secret-dependent or sensitive calls to RepiQR Backend/Worker proxies (Frontend → RepiQR Backend/Worker → Third-Party API).
   - Remove private keys, secrets, and hardcoded credentials from frontend code, VITE/React envs, assets, and build outputs. Keep secrets exclusively in server-side environment variables.
   - Retain only legitimate public browser configs.

3. Fix "Join Us" Current Location:
   - On explicit user action, request geolocation (lat/long) and reverse-geocode server-side if an API key is required.
   - Dynamically populate full address, area/locality, city, state, PIN/postal code, and country. Do not hardcode location data.
   - Safely handle loading, timeouts, permission denials, and geocoding failures. No background tracking.

4. Update Support Number:
   - Update RepiQR's support number across the app to: 9313719720 (do not alter user/customer numbers).

5. Simplify Activation Alerts:
   - Clean up the activation alerts UI to display ONLY successfully activated client stickers.
   - Restrict alert data strictly to: Sticker ID | Status | Phone Number (e.g., `QR805ERB | Activated Successfully | +91XXXXXXXXXX`).
   - Remove all failed attempts, activation/recovery codes, hashes, IDs, and metadata.

6. Codebase & Security Cleanup:
   - Search for hardcoded secrets, sensitive variables, and active API calls (`fetch`, `axios`, etc.).
   - Strip production `console.log`, `console.debug`, and `console.table` statements containing internal or sensitive data.
   - Audit endpoints to ensure backend APIs trim unnecessary database fields and adhere to the principle of least-data exposure.
   - Safely remove genuinely unused components, pages, hooks, utilities, assets, dependencies, and dead code after verifying imports/routes.

EXECUTION & DELIVERABLE RULES:
- Trace current code before modifying. Do not invent mock APIs, unnecessary abstractions, or fake security layer obfuscation.
- Run type-checking, linting, and production build checks; resolve any issues introduced.
- Provide ONLY a concise summary upon completion containing:
  1. Changed files
  2. Removed files
  3. APIs moved server-side
  4. Security exposures fixed
  5. Join Us location fix summary
  6. Support number update locations
  7. Alerts changes summary
  8. Build/test results
  9. Remaining browser-visible third-party requests (with rationale)

  add real map with radius show 

  and one more 
(node:14272) [MONGOOSE] Warning: mongoose: Duplicate schema index on {"created_at":1} for model "Alert". This is often due to declaring an index using both "index: true" and "schema.index()". MongoDB will not create the duplicate index and options on the duplicate definition (such as expireAfterSeconds or unique) will not be applied. Please remove the duplicate index definition.
(Use `node --trace-warnings ...` to show where the warning was created)


from offical repiqr i test  whaspp notificaitn was not reciving



do not blur the service provider user will send reqeuest that will comes in admin pannel then admin will arrage it that have the number share in dashboard og the admin so admin wil contact with the visitor 