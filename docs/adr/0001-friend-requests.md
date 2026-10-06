# 0001 — Friend requests gate who can join expenses

## Status
Accepted

## Context
Expense participants and "Paid by" need a user picker. An open user directory exposes every user's name and email and allows account enumeration. Registration does not verify email.

## Decision
- Users connect through friend requests: sent by email, accepted from the email link or in the app.
- Requests may target emails without an account; they appear in the recipient's inbox after registering (matched by email).
- Friendships are stored as two symmetric rows. Requests keep one reusable row per sender + email; the emailed token is stored only as a SHA-256 hash.
- Email-link responses are public POST endpoints (token in the body) so link scanners cannot auto-accept; they are throttled per IP.
- Expenses accept only the owner and their friends. On edit, only newly introduced users are checked. Settlements are not restricted.
- Mail is sent fire-and-forget; failures are logged and the sender can resend.

## Consequences
- Adds SMTP as a runtime dependency (Mailpit in local dev).
- Because email is unverified, someone registering with another person's address can see requests sent to it; low impact (it only grants a friendship) until email verification exists.
- Removing a friend keeps past expenses and balances; new expenses cannot include them.
- Migration backfills friendships from existing shared expenses and settlements.
