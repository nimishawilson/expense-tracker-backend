# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

NestJS backend for an expense tracker app. MVP in progress — see `spec.md` for the full product specification (user management, expense CRUD with split strategies, balances, settlements, friends). Implemented: auth/profile, categories, expenses (split strategies + preview), balances, settlements, dashboard monthly summary, friends and friend requests.

## Commands

- `npm run start:dev` — run the app with hot reload
- `npm run build` — compile with `nest build`
- `npm run lint` — eslint with `--fix` over `src`, `apps`, `libs`, `test`
- `npm run format` — prettier write over `src/**/*.ts` and `test/**/*.ts`
- `npm run test` — unit tests (Jest, config lives in `package.json`)
- `npm run test -- <path-or-name>` — run a single test file or match by name
- `npm run test:watch` — unit tests in watch mode
- `npm run test:cov` — unit tests with coverage
- `npm run test:e2e` — e2e tests (config: `test/jest-e2e.json`)

### Prisma

- Schema: `prisma/schema.prisma`; config: `prisma.config.ts` (reads `DATABASE_URL` from `.env`)
- Generated client output goes to `generated/prisma` (not `node_modules/.prisma`), imported from there directly
- `npx prisma migrate dev` — create/apply a migration during development
- `npx prisma generate` — regenerate the client into `generated/prisma` after schema changes

## Architecture

- Standard NestJS module/controller/service structure, entry point `src/main.ts`
- A global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) is applied in `main.ts` — DTOs should use `class-validator`/`class-transformer` decorators to define validation, and any new request payload needs a DTO for the pipe to enforce
- Feature modules live under `src/<feature>/` (e.g. `src/user/`), each expected to have its own `dto/` subfolder
- Prisma is the ORM (models: `User`, `Category`, `Expense`, `ExpenseParticipant`, `Settlement`, `FriendRequest`, `Friendship`). Passwords are hashed with `bcrypt` before storage
- Auth is JWT (`JwtAuthGuard`, `req.user = {id, email}`); all feature routes except `/auth/*` and `/friend-requests/token/*` require it
- Friends: `src/friend/` (request/accept via email link or in-app). Friendships are stored as two rows (A→B, B→A). Expense participants and `paidById` must be the owner or one of their friends (`FriendService.assertCanUse`); settlements are not restricted
- Email: `src/mail/MailService` (nodemailer/SMTP, never throws). Local dev uses Mailpit from `docker-compose.yml` (UI http://localhost:8025). Env: `FRONTEND_URL`, `SMTP_*`, `MAIL_FROM`, `FRIEND_REQUEST_TTL_DAYS` (see `.env.example`)
- `@nestjs/throttler` is registered in `AppModule` but applied only per endpoint (`UserThrottlerGuard` / `ThrottlerGuard`) on friend-request routes
