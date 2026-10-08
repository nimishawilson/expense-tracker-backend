# Expense Tracker API: frontend integration guide

Companion to [`openapi.json`](./openapi.json), which is the source of truth for every
endpoint, request body, query param and response shape. This file covers what the
spec cannot express: conventions, flows, business rules and gotchas.

- Base URL (local): `http://localhost:3000`
- Interactive docs (when the backend is running): `http://localhost:3000/api-docs`
- Regenerate the spec after backend changes: `npm run docs:openapi`
- Suggested typed-client generation in the frontend repo: `npx openapi-typescript docs/openapi.json -o src/api/schema.d.ts` (or `orval`)

## 1. Conventions

**Auth.** `POST /auth/register` and `POST /auth/login` return `{ accessToken, user }`.
Send `Authorization: Bearer <accessToken>` on every other request. The only public
routes are `/auth/*` and `/friend-requests/token/*`. There is no refresh token;
token lifetime is `JWT_EXPIRES_IN` (default `1d`). On any `401`, clear the token
and send the user to login.

**Content type.** JSON in, JSON out.

**Validation is strict.** Unknown properties in a body or query are rejected with
`400` (`forbidNonWhitelisted`), so send only the fields in the spec.

**Money.**
- Requests: JSON `number`, at most 2 decimal places, positive (`49.99`).
- Responses: **decimal strings** (`"49.99"`). Never parse with floats for
  arithmetic; display them or use a decimal library.

**Dates.** ISO 8601 strings (`2026-09-20T00:00:00.000Z`).

**Ids.** Positive integers.

**Pagination.** List endpoints take `page` (default 1) and `limit` (default 20,
max 100) and return `{ data, total, page, limit }`. Applies to `/expenses`,
`/settlements`, `/friends`, `/friend-requests`. `/categories` and `/balances`
are not paginated.

**Errors.** Standard Nest shape:
```json
{ "statusCode": 400, "message": "...", "error": "Bad Request" }
```
`message` is a `string`, or a `string[]` for DTO validation failures (one entry
per failed field). Handle both. Common codes: `400` validation or business rule,
`401` missing/invalid token or bad credentials, `403` not allowed, `404` not found
(also used to hide resources you can't see), `409` conflict, `410` expired,
`429` throttled.

**Users are referenced as** `{ id, name }` (no email) inside expenses and
settlements. Emails only appear on your own profile, on friends, and on friend
requests.

## 2. Endpoint map

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login` |
| Profile | `GET/PATCH /users/me`, `PATCH /users/me/password` |
| Categories | `GET/POST /categories`, `GET/PATCH/DELETE /categories/:id` |
| Expenses | `GET/POST /expenses`, `POST /expenses/split-preview`, `GET/PATCH/DELETE /expenses/:id` |
| Balances | `GET /balances` |
| Settlements | `GET/POST /settlements` |
| Dashboard | `GET /dashboard/summary?month=YYYY-MM` |
| Friends | `GET /friends`, `DELETE /friends/:friendId` |
| Friend requests | `POST/GET /friend-requests`, `POST /friend-requests/:id/{accept,reject,resend}`, `DELETE /friend-requests/:id` |
| Friend request (public, email link) | `POST /friend-requests/token/{details,accept,reject}` |

(`GET /` is a health/hello route; ignore it.)

## 3. Auth and profile

- **Register** needs `name` (letters and spaces only, min 2), `email`, `password`
  (min 6), `confirmPassword` (must equal `password`). `409` if the email exists.
  Registering does not require a prior login; use the returned token right away.
- **Login** returns `401 Invalid credentials` for both unknown email and wrong password.
- **Profile** `PATCH /users/me` accepts `name`, `defaultCurrency` (3 uppercase letters,
  e.g. `INR`), `timeZone` (IANA, e.g. `Asia/Kolkata`). All optional.
- **Change password** needs `currentPassword`, `newPassword` (min 6), `confirmNewPassword`.
  `401` if the current password is wrong.
- `defaultCurrency` is display-only: amounts are stored without a currency. Use it
  to format money in the UI. `timeZone` drives the dashboard month boundaries.

## 4. Categories

- `GET /categories` returns default (global, `isDefault: true`, `userId: null`)
  plus the user's own custom categories. Use it for the expense category picker.
- Default categories are read-only: `PATCH`/`DELETE` returns `403`.
- Create/rename with a name already used by that user: `409`.
- Delete of a category used by any expense: `409`. Offer reassignment or hide the delete button.
- `name` max 50 chars, `icon` optional (an emoji), max 10 chars.

## 5. Friends are a prerequisite for sharing

An expense's participants and `paidById` must be **you or one of your friends**.
Anything else returns `400` with
`User(s) not found or not in your friends list: 7, 9`. (The same message is used for
"no such user", on purpose.) So the participant and paid-by pickers should be fed
by `GET /friends`, and the app should steer new users to add friends first.

Settlements are the exception: they are not restricted to friends.

### Friend request flow

1. `POST /friend-requests` with `{ email }`. The email does not need to belong to
   a registered user, and the response looks the same either way (no account
   enumeration). An email with a link is sent to the recipient.
   - Sending to yourself: `400`. Already friends: `409`.
   - Repeating a request that is still pending is idempotent (returns the same request).
   - If the other person already sent you a pending request, sending one back
     **accepts theirs** and returns it with `status: "ACCEPTED"`.
   - A request declined within the last 7 days: `409` (try again later).
   - Throttled to 20 sends per hour per user: `429`.
2. Recipient sees it in-app via `GET /friend-requests` (defaults: `direction=incoming`,
   pending only, expired hidden). `total` works as the inbox badge count.
   `?direction=outgoing` lists what you sent (all statuses by default).
3. In-app respond: `POST /friend-requests/:id/accept` or `/reject`.
   `409` if no longer pending, `410` if expired, `404` if not addressed to you.
4. Sender can `POST /friend-requests/:id/resend` (new link, fresh expiry; `429` if
   resent within 1 hour or after 3 total sends) or `DELETE /friend-requests/:id` to
   cancel a pending one.
5. `DELETE /friends/:friendId` removes the friendship both ways. Existing expenses,
   balances and settlements stay intact.

Request objects have `status` (`PENDING | ACCEPTED | REJECTED | CANCELLED`) and an
`expired` boolean (pending but past expiry). Check `expired` before showing Accept.

### Email link landing page (public, no JWT)

The email links to `{FRONTEND_URL}/friends/respond?token=<token>`. The frontend
needs a route at `/friends/respond` that:

1. Reads `token` from the query string and calls `POST /friend-requests/token/details`
   with `{ token }` → `{ senderName, receiverEmail, status, expired, recipientRegistered }`.
   `404` for an unknown token.
2. If `recipientRegistered` is `false`: send them to register using `receiverEmail`,
   then back to this page.
3. Otherwise show Accept / Decline, calling `POST /friend-requests/token/accept` or
   `/reject` with `{ token }`.
   - `409` with body `code: "REGISTRATION_REQUIRED"` (and `email`) when accepting
     without an account: route to registration.
   - Other `409` = already responded; `410` = expired.
- These endpoints are `POST` on purpose (email scanners only issue `GET`).
  Throttled to 20/min: `429`.

## 6. Expenses

### Create / update body

```json
{
  "amount": 90,
  "description": "Dinner",
  "date": "2026-09-20T00:00:00.000Z",
  "categoryId": 3,
  "paidById": 5,
  "splitType": "PERCENTAGE",
  "participants": [
    { "userId": 1, "value": 50 },
    { "userId": 5, "value": 50 }
  ]
}
```

- `paidById` is optional (defaults to the current user).
- `splitType` and `participants` are **both-or-neither**: omit both for an unsplit
  (personal) expense, otherwise send both. `splitType: null` is rejected.
- `description` max 255.
- `categoryId` must be a default category or one the user owns (else `404`).

### Split types and what `value` means

| `splitType` | `value` per participant | Rule |
|---|---|---|
| `EQUAL` | **must be omitted** | Amount divided evenly; leftover cents distributed by largest remainder |
| `PERCENTAGE` | percentage | Must sum to 100 (±0.01) |
| `EXACT` | exact amount owed | Must sum to the expense `amount` exactly |
| `SHARES` | share weight (e.g. 2, 1, 1) | Proportional split |

For non-EQUAL types every participant needs a positive `value`. Duplicate
`userId`s are rejected (`400`). Participants **include the payer** if the payer
also owes a share: list them explicitly.

### Preview before saving

`POST /expenses/split-preview` takes `{ amount, splitType, participants }` and
returns the computed `shareAmount` per participant using the same rules as
create/update, without saving. Use it for a live "who owes what" display while
the form is being filled; handle `400` as inline validation.

### Reading

- `GET /expenses` returns expenses you **own or participate in**, newest first.
  Filters: `fromDate`, `toDate`, `categoryId`, `participantId`, plus pagination.
- Each expense includes `category`, `owner`, `paidBy`, `splitType` (`null` if
  unsplit), and `participants[]` with `shareAmount` (computed) and `inputValue`
  (raw input, `null` for EQUAL).
- `GET /expenses/:id` returns `404` if you're neither owner nor participant.

### Permissions on edit/delete

Only the **owner** may `PATCH`/`DELETE` (`403` otherwise). Participants are
read-only: hide the edit/delete controls when `expense.ownerId !== me.id`.

`PATCH` is partial. Changing `amount`, `splitType` or `participants` recalculates
the split, so send `splitType` and `participants` together when changing them.
Splits cannot be cleared via `PATCH` (no `null`). On edit, only *newly added*
people must be friends, so old expenses stay editable after an unfriend.

## 7. Balances and settlements

- `GET /balances` → `{ totalYouOwe, totalYouAreOwed, netBalance, breakdown[] }`.
  Each `breakdown` entry: `counterpartUserId`, `counterpartName`, `youOwe`,
  `youAreOwed`, `net` (positive = they owe you, negative = you owe them).
  Only counterparts with a non-zero balance appear. Balances already account for
  settlements, so refetch after recording one.
- `POST /settlements` body: `{ fromUserId, toUserId, amount, note? }`. `fromUserId` is
  who pays, `toUserId` who receives. You must be one of the two (`403`), they must
  differ (`400`), and both must exist (`404`).
  "Settle up" with someone you owe: `fromUserId = me`, `toUserId = them`,
  `amount = youOwe`.
- `GET /settlements` lists those you're a party to. Filters: `counterpartUserId`,
  `fromDate`, `toDate`, plus pagination.
- Settlements are immutable (no edit/delete endpoint).

## 8. Dashboard

`GET /dashboard/summary?month=2026-09` (`YYYY-MM`, optional, defaults to the current
month in the user's time zone) returns `{ month, timeZone, from, to, currency, totalSpent }`.
`totalSpent` is the user's **own** spend: full amount of unsplit expenses they own,
plus their share of split expenses they participate in. It is not the sum of
amounts they paid.

## 9. Things to know before integrating

- **CORS is not enabled in the backend yet.** Browser calls from the frontend dev
  server (e.g. `http://localhost:5173`) will be blocked until
  `app.enableCors({ origin: process.env.FRONTEND_URL })` (or a dev proxy) is added.
  Either add it on the backend or proxy `/api` through Vite.
- **No refresh tokens**, no logout endpoint: logout is client-side (drop the token).
- Friend-request emails link to `FRONTEND_URL` (default `http://localhost:5173`).
  Local mail is caught by Mailpit at `http://localhost:8025` (`docker compose up -d`).
- Suggested build order: auth → profile → categories → friends and friend requests
  (including the `/friends/respond` landing page) → expenses (with split preview) →
  balances and settlements → dashboard.
