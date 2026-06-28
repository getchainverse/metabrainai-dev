# Deployment Guide

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Strong `JWT_SECRET` and `SESSION_SECRET` (32+ random bytes)
- [ ] PostgreSQL managed instance with backups
- [ ] HTTPS on frontend and API (required for MetaMask)
- [ ] CORS restricted to production frontend origin
- [ ] Remove or lock legacy unauthenticated auth routes
- [ ] Redis for rate limiting + Socket.IO scaling (recommended)

## Environment Variables

### Backend (`metaverse-backend/.env`)

Copy from `.env.example` and set all values. Critical:

```env
DATABASE_URL=postgresql://user:pass@host:5432/metabrain
JWT_SECRET=<random-64-chars>
SESSION_SECRET=<random-64-chars>
CORS_ORIGINS=https://app.yourdomain.com
OPENAI_API_KEY=sk-...
ETH_RPC_URL=https://mainnet.infura.io/v3/...
STORE_TREASURY_ADDRESS=0x...
```

### Frontend (`metaverse-frontend/.env`)

```env
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_SOCKET_URL=https://api.yourdomain.com
```

Build embeds these at compile time.

## Database

```bash
cd metaverse-backend
npx prisma migrate deploy
npx prisma generate
```

Use PgBouncer or Prisma connection pooling for high traffic.

## Docker (Backend)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3001
CMD ["node", "server.js"]
```

```bash
docker build -t metabrain-api ./metaverse-backend
docker run -p 3001:3001 --env-file metaverse-backend/.env metabrain-api
```

## Frontend Build

```bash
cd metaverse-frontend
npm ci
npm run build
```

Serve `build/` with Nginx, Vercel, Netlify, or S3+CloudFront.

## Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 443 ssl;
    server_name app.yourdomain.com;
    root /var/www/metabrain/build;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}
```

## Horizontal Scaling

1. Run multiple backend replicas behind a load balancer
2. Add `@socket.io/redis-adapter` for shared socket state
3. Replace in-memory rate limiter with Redis (`rate-limiter-flexible`)
4. Move world player state to Redis (currently in-memory)

## Monitoring

- Health: `GET /health` every 30s
- Logs: JSON stdout → CloudWatch / Datadog / Loki
- Alerts on 5xx rate, DB disconnect, high 429 rate

## SSL / Web3

MetaMask requires HTTPS in production. Use Let's Encrypt or cloud provider certificates.

## Rollback

```bash
npx prisma migrate resolve --rolled-back <migration_name>
git checkout <previous-tag>
docker build && deploy
```
