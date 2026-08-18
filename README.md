<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
npm install
```

## Local database

PostgreSQL runs in Docker and stores its data in the persistent
`postgres_data` volume. Make sure your `.env` contains the same connection
string as `.env.example` (`localhost:5433`), then start the database and
synchronize the Prisma schema:

```bash
npm run db:up
npm run db:push
```

Useful commands:

```bash
npm run db:logs # follow PostgreSQL logs
npm run db:down # stop containers and keep database data
npm run db:generate # regenerate Prisma Client
```

## Compile and run the project

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## API documentation

With the application running, Swagger UI is available at
`http://localhost:3000/api/docs`. The OpenAPI JSON document is available at
`http://localhost:3000/api/docs-json`.

## Data-room search

Search ignores the folder hierarchy and only returns resources owned by the
authenticated user. Matching is case-insensitive and checks whether the name
contains the supplied query:

- `GET /folders/search?query=contract` — search all folders.
- `GET /files/search?query=contract` — search all files.

The `query` parameter is required, trimmed, and limited to 255 characters.

## PDF storage and uploads

PDFs are stored in a private Cloudflare R2 bucket. The browser uploads directly
to R2 with a short-lived presigned URL, so file contents do not pass through the
NestJS/Vercel function.

Create an R2 bucket and an S3 API token with Object Read & Write access for that
bucket, then configure the `R2_*` values from `.env.example`. Keep the bucket
private. In the bucket CORS settings, allow every frontend origin that will use
the API (replace the example production origin):

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://your-frontend.vercel.app"
    ],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Add an Object Lifecycle Rule for the `uploads/` prefix that expires objects
after one day. Completed files are moved to `files/`, while abandoned temporary
uploads are cleaned automatically. See the
[Cloudflare lifecycle documentation](https://developers.cloudflare.com/r2/buckets/object-lifecycles/).

Upload lifecycle:

1. `POST /files/upload-url` returns an `uploadId`, the direct R2 `upload`, and
   `maxFileSizeBytes`. No `File` entity is created yet.
2. `PUT upload.url` with the raw PDF body and the exact headers returned in
   `upload.headers`.
3. `POST /files` with `uploadId`, `name`, exact `size`, and an optional
   `folderId`. The API checks content type, size, and PDF magic bytes, moves the
   object out of the temporary prefix, and creates the `File` entity. If the
   name already exists at that folder level, the API adds the first available
   numeric suffix (for example, `contract (1).pdf`).
4. `GET /files/:id/download` returns a short-lived private download URL.

Move an existing file with `PATCH /files/:id/move`. Send a destination folder
as `{ "folderId": "<uuid>" }`, or move it to the data-room root with
`{ "folderId": null }`. The destination must belong to the authenticated user
and must not already contain a file with the same name.

Browser example:

```ts
const initResponse = await fetch(`${apiUrl}/files/upload-url`, {
  method: 'POST',
  credentials: 'include',
});
const { uploadId, upload, maxFileSizeBytes } = await initResponse.json();

if (pdf.size > maxFileSizeBytes) throw new Error('PDF is too large');

await fetch(upload.url, {
  method: upload.method,
  headers: upload.headers,
  body: pdf,
});

const fileResponse = await fetch(`${apiUrl}/files`, {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uploadId,
    name: pdf.name,
    size: pdf.size,
    folderId,
  }),
});
const file = await fileResponse.json();
```

The default maximum is 50 MiB and presigned URLs expire after 15 minutes. Both
are configurable through `.env`. Deleting a file or a folder also deletes its
stored R2 objects.

## Sharing

Shares can expose the entire data room (`ALL`), a folder and its descendants
(`FOLDER`), or one PDF (`FILE`). A share is either public through a secret token
or restricted to recipient emails. Recipients do not need an account when the
share is created: after registering with the same normalized email, the share
automatically appears in `GET /shares/received`. An optional future `expiresAt`
timestamp is checked together with the revocation state on every access.

Authenticated endpoints:

- `POST /shares` — create a `PUBLIC` or `AUTHORIZED` share.
- `GET /shares` — list shares created by the current user, including revoked
  ones.
- `GET /shares/received` — list active authorized shares received by the
  current user.
- `POST /shares/:id/public-token` — issue a replacement token for an active
  owned public share. The previous token stops working.
- `GET /shares/:id/content?folderId=...` — browse an accessible share. Omit
  `folderId` to open its root.
- `GET /shares/:id/files/:fileId/download` — get a short-lived download URL for
  a PDF within the share.
- `DELETE /shares/:id` — revoke an owned share.

Public endpoints do not require authentication:

- `GET /public/shares/:token/content?folderId=...`
- `GET /public/shares/:token/files/:fileId/download`

Example public folder share:

```json
{
  "mode": "PUBLIC",
  "targetType": "FOLDER",
  "folderId": "c05e2953-cbf2-4835-a88a-e1e0f7623190",
  "expiresAt": "2026-09-01T12:00:00.000Z"
}
```

Example authorized file share:

```json
{
  "mode": "AUTHORIZED",
  "targetType": "FILE",
  "fileId": "07a6ce96-855a-4b20-ad70-e3e30fd41243",
  "recipientEmails": ["viewer@example.com"]
}
```

For a public share, `POST /shares` returns `publicToken` at creation. The
database stores only its SHA-256 hash, so a lost token cannot be recovered.
The owner can call `POST /shares/:id/public-token` to receive a replacement and
copy the public URL again; issuing a replacement invalidates the previous
token. Content responses never expose storage object keys; downloads always
use short-lived presigned URLs.

## Authentication

- `POST /auth/register` — register with email and password.
- `POST /auth/login` — log in with email and password.
- `GET /auth/google` — start Google OAuth login.
- `POST /auth/logout` — clear the authentication cookie.

Email/password and Google login both create the same HTTP-only JWT cookie.

JWT tokens use `HS256`. Set a long random secret in `.env`:

```bash
openssl rand -base64 48
```

```env
JWT_SECRET=generated-value
```

Use tracked Prisma migrations instead of `db push` for production databases.

## Run tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Deployment

Vercel builds the production container from `Dockerfile.vercel`. Configure the
variables from `.env.example` in the Vercel project, then deploy from the
repository root:

```bash
vercel deploy --prod
```

The application already listens on Vercel's runtime-provided `PORT`. Run
database migrations as a separate deployment step; do not run them in the
container startup command because multiple instances can start concurrently.

For a new production database, apply the tracked schema before starting the
application:

```bash
npm run db:migrate:deploy
```

If an existing database was previously created with `prisma db push`, first
back it up and verify that it matches the pre-upload schema. Then baseline it
and apply only the upload migration:

```bash
npx prisma migrate resolve --applied 20260818000000_init
npm run db:migrate:deploy
```

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
