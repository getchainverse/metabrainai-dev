# API Reference

**Base URL:** `http://localhost:3001` (configurable via `PORT`)

**Authentication:** Bearer JWT in `Authorization` header for protected routes.

---

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/wallet/nonce` | — | Get wallet sign-in challenge |
| POST | `/api/auth/wallet/verify` | — | Verify signature, receive JWT |
| GET | `/api/auth/wallet/me` | Bearer | Current wallet user |
| POST | `/api/auth/signup` | — | Legacy email registration |
| POST | `/api/auth/signin` | — | Legacy email login |
| POST | `/api/auth/signout` | — | Clear session |
| POST | `/api/auth/sendmail` | — | Password reset email |
| POST | `/api/auth/resetpasswordbyuser` | — | Reset password |
| POST | `/api/auth/setrolebyuser` | Admin | Assign legacy role |
| GET | `/api/auth/getalluserdata` | Admin | List all legacy users |

## Profile

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/profile` | Bearer | Get profile |
| PATCH | `/profile` | Bearer | Update profile |
| GET | `/avatar-customization` | Bearer | Get avatar appearance |
| PATCH | `/avatar-customization` | Bearer | Update avatar |

## Store

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/store/categories` | — | List categories |
| GET | `/api/store/items` | — | List items |
| GET | `/api/store/inventory` | Bearer | User inventory |
| GET | `/api/store/transactions` | Bearer | Purchase history |
| POST | `/api/store/purchase` | Bearer | Coin purchase |
| POST | `/api/store/purchase/verify` | Bearer | Verify ETH tx on-chain |
| POST | `/api/store/equip` | Bearer | Equip owned item |
| POST | `/api/store/items` | Admin | Create item |
| PATCH | `/api/store/items/:id` | Admin | Update item |
| DELETE | `/api/store/items/:id` | Admin | Delete item |

## Social

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/social/friends` | Bearer | Friend list |
| GET | `/api/social/requests` | Bearer | Pending requests |
| GET | `/api/social/notifications` | Bearer | Notifications |
| GET | `/api/social/messages/:friendId` | Bearer | DM history |
| POST | `/api/social/friend-requests` | Bearer | Send request |
| PATCH | `/api/social/friend-requests/:id` | Bearer | Accept/reject |
| POST | `/api/social/messages` | Bearer | Send DM |
| PATCH | `/api/social/notifications/:id/read` | Bearer | Mark read |

## NPC

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/npc/history` | Bearer | Conversation history |
| POST | `/api/npc/chat` | Bearer | Stream AI reply (SSE) |

## Admin

All routes require admin role.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/dashboard` | Stats overview |
| CRUD | `/api/admin/users` | User management |
| CRUD | `/api/admin/roles` | RBAC roles |
| CRUD | `/api/admin/permissions` | Permissions |
| CRUD | `/api/admin/knowledge-bases` | RAG documents |
| POST | `/api/admin/knowledge-bases/upload` | Upload document |
| POST | `/api/admin/knowledge-bases/search` | Semantic search |
| CRUD | `/api/admin/avatars` | AI avatar configs |

## Socket.IO Events

Connect with `auth: { token: "<JWT>" }`.

### World

| Event | Direction | Description |
|-------|-----------|-------------|
| `world:init` | S→C | Room state on join |
| `player:joined` | S→C | New player entered |
| `player:state` | C↔S | Position/animation sync |
| `player:left` | S→C | Player disconnected |
| `voice:*` | C↔S | WebRTC signaling |

### Social

| Event | Direction | Description |
|-------|-----------|-------------|
| `social:init` | S→C | Online users on connect |
| `social:presence` | S→C | User online/offline |
| `social:friend-request` | C↔S | Friend request (auth required) |
| `social:message` | C↔S | Direct message (auth required) |
| `social:notification` | S→C | Notification push |
| `social:error` | S→C | Auth/validation error |

## Rate Limits

| Scope | Limit |
|-------|-------|
| Global | 300 req/min per IP |
| Auth signin/signup | 5–10/min |
| Wallet nonce/verify | 10/min |
| NPC chat | 15/min |
| Social messages | 60/min |
| Store purchase | 10/min |
| Admin | 30/min |
| Profile | 60/min |

429 responses include `Retry-After` header.

## Health

```http
GET /health
```

```json
{ "status": "ok", "database": "connected" }
```
