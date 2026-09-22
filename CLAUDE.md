# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

NestJS backend for an expense tracker app. Very early stage (MVP scaffolding) — see `spec.md` for the full product specification (user management, expense CRUD with split strategies, balances, settlements). Only user registration/model groundwork exists so far; most of `spec.md` is not yet implemented.

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
- Prisma is the ORM; the `User` model (`id`, `name`, `email` unique, `password`, timestamps) is the only model defined so far. Passwords are hashed with `bcrypt` before storage
- No auth (JWT/session) is wired up yet, despite being called for in `spec.md`
