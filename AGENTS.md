# AGENTS.md

## Project overview

This repository contains the NestJS backend for a data-room application. It uses TypeScript, Prisma ORM with PostgreSQL, JWT-based authentication, Swagger, and Cloudflare R2-compatible object storage for PDF files.

## Repository map

- `src/main.ts` — application bootstrap, CORS, global validation, and Swagger setup.
- `src/auth/` — email/password and Google authentication, JWT sessions, guards, decorators, and user access.
- `src/data-room/` — folders, PDF metadata, upload completion, and download URL flows.
- `src/config/` — validated application configuration grouped by concern.
- `src/prisma/` — the shared Prisma service and module.
- `prisma/schema.prisma` — database schema.
- `src/generated/prisma/` — generated Prisma Client code; do not edit it manually.
- `test/` — end-to-end tests. Unit tests live beside source files as `*.spec.ts`.

## Setup and common commands

Use npm and keep `package-lock.json` in sync with dependency changes.

```bash
npm install
cp .env.example .env
npm run db:up
npm run db:push
npm run db:generate
npm run start:dev
```

Before handing off a change, run the checks relevant to the files touched:

```bash
npm run lint
npm run format:check
npm run test
npm run test:e2e
npm run build
```

Do not run `npm run format` across the whole repository unless broad formatting changes are intended. Prefer formatting only files changed by the task.

## Implementation conventions

- Follow the existing NestJS module/controller/service structure and dependency injection patterns.
- Keep controllers focused on HTTP concerns. Put business rules and Prisma operations in services.
- Define request inputs as DTO classes under the feature's `dtos/` directory. Use `class-validator` decorators and Swagger decorators for public API fields.
- The global `ValidationPipe` transforms inputs and strips fields not declared by DTOs. Do not bypass it with untyped request bodies.
- Use `ConfigService` and typed config factories from `src/config/`. Never read secrets directly outside configuration/bootstrap code or commit real credentials.
- Use the shared `PrismaService`; do not construct additional Prisma clients.
- Scope reads and writes of user-owned folders and files by `userId`. Never trust a client-supplied owner ID.
- Avoid returning sensitive fields such as `passwordHash`, `storageKey`, JWTs, or storage credentials.
- Reuse existing decorators and guards for authentication. Routes are protected by default; mark a route public only when anonymous access is intentional.
- Keep imports, naming, and formatting consistent with nearby files. Let ESLint and Prettier be the source of truth.

## Prisma and database changes

- Update `prisma/schema.prisma` for model changes, then run `npm run db:generate`.
- Use `npm run db:push` only for local development. Production schema changes should use reviewed, tracked migrations.
- Preserve ownership filters, relation delete behavior, and indexes when changing models.
- Treat changes that can drop or rewrite data as destructive. Do not apply them to a non-local database without explicit approval.

## Authentication and security

- The access token may come from the configured HTTP-only cookie or an `Authorization: Bearer` header.
- Preserve secure cookie behavior and CORS credentials support when changing authentication.
- Do not weaken password hashing, token validation, ownership checks, upload validation, or authorization to make a test pass.
- Validate PDF size, content type, stored-object metadata, and file signature before marking an upload as ready.
- Do not expose R2 object keys directly; use the storage service and short-lived presigned URLs.

## Testing expectations

- Don't write any tests

## Change discipline

- Keep changes scoped to the requested task and preserve unrelated work already present in the worktree.
- Do not edit generated output, build artifacts, coverage output, or installed dependencies.
- Do not introduce a new dependency when the current stack can solve the problem clearly.
- Update `.env.example`, Swagger metadata, and README instructions when a public endpoint, configuration variable, or setup step changes.
- For API-breaking or schema-breaking changes, call out the compatibility impact in the handoff.

## Definition of done

A change is complete when implementation, relevant tests, generated Prisma code (when applicable), documentation/config examples, and lint/build checks agree with one another. Report which checks passed and any checks that could not be run.
