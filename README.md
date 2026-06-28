# MetaBrain AI Metaverse

A Web3-enabled 3D metaverse with wallet authentication, multiplayer world, NPC AI chat, social features, in-world store, and admin panel.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Three Fiber, Tailwind CSS, Socket.IO |
| Backend | Node.js, Express, Prisma (PostgreSQL), Sequelize (legacy MySQL) |
| Realtime | Socket.IO (world multiplayer + social presence) |
| AI | OpenAI GPT, ChromaDB RAG, Xenova embeddings |
| Web3 | ethers.js, MetaMask SIWE-style auth, ETH store payments |

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- (Optional) MySQL for legacy email auth, ChromaDB for RAG, OpenAI API key

### Backend

```bash
cd metaverse-backend
cp .env.example .env   # fill in secrets
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev            # http://localhost:3001
```

### Frontend

```bash
cd metaverse-frontend
npm install
npm start              # http://localhost:3000
```

Set `REACT_APP_API_URL=http://localhost:3001` in `metaverse-frontend/.env` (optional; defaults to localhost:3001).

## Features

| Route | Description |
|-------|-------------|
| `/` | 3D world (WASD, voice chat, NPC interaction) |
| `/login` | Email or MetaMask wallet sign-in |
| `/profile` | Avatar customization |
| `/store` | Item catalog and ETH purchases |
| `/social` | Friends, DMs, realtime notifications |
| `/admin` | Users, roles, knowledge base, store (admin only) |

## Documentation

- [API Reference](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## Project Structure

```
metabrainai-dev/
├── metaverse-backend/     # Express API + Socket.IO + Prisma
├── metaverse-frontend/    # React SPA + Three.js world
└── docs/                  # API, architecture, deployment
```

## Health Check

```bash
curl http://localhost:3001/health
```

## License

ISC
