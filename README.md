# Partida StudentTrack

StudentTrack is an attendance and student wellbeing prototype for Partida National High School. Account authentication uses the included Node/Express and PostgreSQL server; student records, parent-child links, and preferences are still stored in each browser.

## Run the website

Install the included dependencies, configure PostgreSQL, then start the app server from this folder:

```powershell
npm install
npm start
```

Then visit <http://localhost:3000>. Stop the server with `Ctrl+C`. If PowerShell blocks the `npm` script, run `npm.cmd install` and `npm.cmd start`.

The server uses the standard PostgreSQL environment variables (`PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD`) or `DATABASE_URL`; do not put database credentials in source code or share them in chat. The server creates the authentication tables and adds the 2FA/session columns when it starts. Existing server passwords from the earlier plaintext prototype are upgraded to scrypt hashes after a successful login.

Before enabling 2FA, configure `TOTP_ENCRYPTION_KEY` as a private 64-character hexadecimal key. Generate one with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Store the generated value in the server's environment or secret manager, not in this project. Keep it backed up securely: encrypted authenticator secrets cannot be decrypted without the same key. For production, set `NODE_ENV=production` and serve the app only over HTTPS so the session cookie is marked `Secure`.

The app uses browser `localStorage` for class records and `sessionStorage` is no longer an authentication source. Local-only accounts from the earlier prototype are not automatically imported; users must create server-backed accounts. The old browser data is left in its existing browser origin, but opening the app at a different origin may not show that data. Use fictional student data for demonstrations and download a backup from **Class setup** before clearing browser data.

## Current functionality

- Teacher and parent portal screens with PostgreSQL-backed account registration and sign-in. Passwords are stored as scrypt hashes and sign-in uses an HTTP-only server session cookie.
- Student rosters, profiles with a month attendance calendar, date-filtered attendance and behavior histories, class filters, student search, archive/restore, and print views. Archived students are listed under their original section in the student roster and can be restored there. Teachers can select the grade and section for bulk import, paste one `Student Name-LRN` pair per line (for example, `Juan Dela Cruz-123456789012`), and archive all students in a section, grade level, or school while keeping their records restorable.
- Custom section details, including a classroom adviser and section photo, plus optional student and teacher profile photos. Uploaded photos are resized in the browser and stored locally with the related profile or section.
- Attendance statuses: Present, Absent, Late, Excused, and Unmarked.
- Attendance statuses can be recorded, changed, or cleared with one click and no confirmation dialog. The audit history retains old/new statuses, timestamp, and recorder.
- Settings can enroll server-backed accounts in authenticator-based TOTP 2FA after password re-entry. Enrollment stays pending until a valid code is confirmed; sign-in then requires a current authenticator code or an unused recovery code.
- The overview provides daily section summaries plus 7-day, 30-day, and custom attendance trends (up to 366 days) with CSV and print reports. Rates use (Present + Late) / (Present + Late + Absent); Excused and Unmarked records are excluded. Trend unmarked counts include the full current roster on dates with no submissions, except dates marked as non-school days. There is no PDF dependency or PDF export.
- Teachers and administrators can remove behavior notes from the active list by moving them to **Archived notes**, then restore them later. Removal is recoverable, not permanent. The behavior archive is included in JSON backups.
- School calendar events and holidays/non-school days appear in parent updates on the same browser. Attendance marking is disabled for dates configured as non-school days; ordinary events do not block attendance.
- Parent updates include attendance and behavior events, deduplicate attendance corrections, show read/unread state and event time, and respect each parent's local notification preferences. Child records stay hidden from a parent until a locally signed-in teacher or administrator approves the LRN link request.
- CSV exports, JSON backup/restore, accessibility settings, responsive layouts, and browser alerts where supported.

## Capstone demo guide

1. Start the local server and use fictional names and 12-digit LRNs only.
2. Register a teacher account, add a fictional student to a grade and section, then open **Attendance**. Show that a new student's status is **Unmarked**, not Absent.
3. Mark the student Present, change the status with one click, and open the student profile to show the dated history. Export the attendance or audit CSV to demonstrate the recorded details.
4. Show the student search, class filters, date-filtered profile timelines, class attendance summary, 7/30-day or custom trend report, behavior note workflow, calendar, and downloadable JSON backup. Restore replaces local records, so use it only after confirming the overwrite prompt.
5. A parent can link a child by entering the student’s 12-digit LRN and the link is added immediately in the browser prototype.
6. Demonstrate parent updates using a linked fictional parent-child record. Updates may synchronize between open tabs sharing the same browser storage; they are not cross-device push, email, or SMS.

## Important security and backend limitations

This delivered project is **not a production student-record system**:

- Account passwords are scrypt-hashed, sessions are opaque server-side tokens stored by hash, and authenticator seeds are encrypted in PostgreSQL with `TOTP_ENCRYPTION_KEY`. TOTP recovery codes are shown once and stored as hashes.
- Session cookies are HTTP-only and same-site. Production deployments must use HTTPS and set `NODE_ENV=production`; local HTTP is intended only for development.
- Login and 2FA attempts are rate-limited in each Node process. For multi-instance deployments, use a shared rate limiter and review the deployment's proxy/network configuration.
- Student records, parent-child links, and preferences remain in browser storage. The server does not yet enforce record-level teacher access, verify parent/guardian identity, synchronize records across devices, or send email/SMS/push updates. Server-backed login and 2FA therefore do not protect the locally stored student data.
- New users cannot register as administrators. Administrator provisioning must be performed through a trusted, separately managed process.
- Local-only accounts are not migrated to PostgreSQL. Users must register server accounts; previous browser records are not deleted by the server, but browser data is origin-specific.
- Backups are downloaded to the user's device; there is no automatic or off-site backup.

Use fictional student data until the school has completed a privacy, authorization, backup, and deployment review. Never commit or share the PostgreSQL password or `TOTP_ENCRYPTION_KEY`.

## Data and privacy guidance

Student identifiers and behavior details are sensitive. Limit access, collect only information needed for school support, keep backups encrypted and access-controlled, and follow school and applicable privacy-retention rules. Do not treat a local browser account or an LRN-only request as authentication or relationship verification.
