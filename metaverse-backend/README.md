# Metaverse Backend

Express API server for MetaBrain AI Metaverse.

## Setup

```bash
cp .env.example .env
npm install
npx prisma migrate deploy
npm run dev
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with nodemon |
| `npm run prisma:migrate` | Run Prisma migrations (dev) |
| `npm run prisma:generate` | Regenerate Prisma client |

## Environment

See `.env.example` for all variables. Required:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — JWT signing secret (required in production)

## Endpoints

- `GET /health` — Database connectivity check
- `GET /` — API info

See [../docs/API.md](../docs/API.md) for full API documentation.
