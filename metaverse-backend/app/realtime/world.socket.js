const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");

const ROOM_NAME = "world-01";
const DEFAULT_POSITION = [0, 0.95, 0];
const DEFAULT_ROTATION = 0;
const DEFAULT_ANIMATION = "idle";
const VOICE_RADIUS = Number(process.env.WORLD_VOICE_RADIUS || 12);
const DEFAULT_APPEARANCE = {
  hairStyle: "short",
  hairColor: "#6b4f3b",
  eyesStyle: "default",
  eyesColor: "#2f3a4a",
  bodyStyle: "athletic",
  bodyColor: "#f2d4b0",
  clothesStyle: "casual",
  clothesColor: "#0f7bde",
  accessories: [],
};
const playersByRoom = new Map();
const voicePairsByRoom = new Map();

const getRoomPlayers = (roomId) => {
  if (!playersByRoom.has(roomId)) {
    playersByRoom.set(roomId, new Map());
  }

  return playersByRoom.get(roomId);
};

const getVoicePairs = (roomId) => {
  if (!voicePairsByRoom.has(roomId)) {
    voicePairsByRoom.set(roomId, new Set());
  }

  return voicePairsByRoom.get(roomId);
};

const normalizeVector = (value, fallback) =>
  Array.isArray(value) && value.length === 3 ? value.map(Number) : fallback;

const normalizeState = (payload = {}) => ({
  position: normalizeVector(payload.position, DEFAULT_POSITION),
  rotation: Number.isFinite(Number(payload.rotation)) ? Number(payload.rotation) : DEFAULT_ROTATION,
  animation: typeof payload.animation === "string" ? payload.animation : DEFAULT_ANIMATION,
  appearance: {
    ...DEFAULT_APPEARANCE,
    ...(payload.appearance && typeof payload.appearance === "object" ? payload.appearance : {}),
  },
  timestamp: Date.now(),
});

const buildPlayerSnapshot = (playerId, player) => ({
  id: playerId,
  userId: player.userId,
  username: player.username,
  walletAddress: player.walletAddress,
  ...player.state,
});

const distanceBetween = (a, b) => {
  const dx = (a?.position?.[0] || 0) - (b?.position?.[0] || 0);
  const dy = (a?.position?.[1] || 0) - (b?.position?.[1] || 0);
  const dz = (a?.position?.[2] || 0) - (b?.position?.[2] || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

const pairKey = (left, right) => [left, right].sort().join("|");

const syncVoicePairs = (io, roomId) => {
  const roomPlayers = getRoomPlayers(roomId);
  const activePairs = getVoicePairs(roomId);
  const nextPairs = new Set();

  const players = Array.from(roomPlayers.entries());
  for (let i = 0; i < players.length; i += 1) {
    for (let j = i + 1; j < players.length; j += 1) {
      const [leftId, leftPlayer] = players[i];
      const [rightId, rightPlayer] = players[j];
      
      // Only pair if both players have voice chat enabled
      if (!leftPlayer.voiceEnabled || !rightPlayer.voiceEnabled) {
        continue;
      }

      if (distanceBetween(leftPlayer.state, rightPlayer.state) > VOICE_RADIUS) {
        continue;
      }

      const key = pairKey(leftId, rightId);
      nextPairs.add(key);
      if (!activePairs.has(key)) {
        io.to(leftId).emit("voice:peer-join", {
          peerId: rightId,
          userId: rightPlayer.userId,
          username: rightPlayer.username,
        });
        io.to(rightId).emit("voice:peer-join", {
          peerId: leftId,
          userId: leftPlayer.userId,
          username: leftPlayer.username,
        });
      }
    }
  }

  activePairs.forEach((key) => {
    if (nextPairs.has(key)) return;
    const [leftId, rightId] = key.split("|");
    io.to(leftId).emit("voice:peer-leave", { peerId: rightId });
    io.to(rightId).emit("voice:peer-leave", { peerId: leftId });
  });

  voicePairsByRoom.set(roomId, nextPairs);
};

const attachWorldSocket = (httpServer, corsOrigins = ["http://localhost:3000"]) => {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    let authUser = {
      userId: socket.id,
      username: "Guest",
      walletAddress: "",
    };

    try {
      const token = socket.handshake.auth?.token;
      if (token) {
        const decoded = jwt.verify(token, config.secret);
        authUser = {
          userId: decoded.id || socket.id,
          username: decoded.username || decoded.walletAddress?.slice(0, 8) || "Guest",
          walletAddress: decoded.walletAddress || "",
        };
      }
    } catch (error) {
      // Anonymous sockets are allowed; they just get guest identities.
    }

    socket.join(ROOM_NAME);

    const roomPlayers = getRoomPlayers(ROOM_NAME);
    const initialState = normalizeState();
    roomPlayers.set(socket.id, {
      ...authUser,
      state: initialState,
      voiceEnabled: false,
    });

    socket.emit("world:init", {
      selfId: socket.id,
      players: Array.from(roomPlayers.entries()).map(([playerId, player]) =>
        buildPlayerSnapshot(playerId, player)
      ),
    });

    socket.to(ROOM_NAME).emit("player:joined", buildPlayerSnapshot(socket.id, roomPlayers.get(socket.id)));
    syncVoicePairs(io, ROOM_NAME);

    socket.on("player:state", (payload) => {
      const current = roomPlayers.get(socket.id);
      if (!current) return;

      current.state = normalizeState(payload);
      roomPlayers.set(socket.id, current);
      socket.to(ROOM_NAME).emit("player:state", buildPlayerSnapshot(socket.id, current));
      syncVoicePairs(io, ROOM_NAME);
    });

    socket.on("voice:join", () => {
      const current = roomPlayers.get(socket.id);
      if (current) {
        current.voiceEnabled = true;
        roomPlayers.set(socket.id, current);
      }
      syncVoicePairs(io, ROOM_NAME);
    });

    socket.on("voice:leave", () => {
      const current = roomPlayers.get(socket.id);
      if (current) {
        current.voiceEnabled = false;
        roomPlayers.set(socket.id, current);
      }
      const activePairs = getVoicePairs(ROOM_NAME);
      const remaining = new Set();
      activePairs.forEach((key) => {
        if (!key.includes(socket.id)) {
          remaining.add(key);
          return;
        }
        const [leftId, rightId] = key.split("|");
        const otherId = leftId === socket.id ? rightId : leftId;
        io.to(otherId).emit("voice:peer-leave", { peerId: socket.id });
      });
      voicePairsByRoom.set(ROOM_NAME, remaining);
    });

    socket.on("voice:offer", ({ peerId, sdp }) => {
      io.to(peerId).emit("voice:offer", { peerId: socket.id, sdp });
    });

    socket.on("voice:answer", ({ peerId, sdp }) => {
      io.to(peerId).emit("voice:answer", { peerId: socket.id, sdp });
    });

    socket.on("voice:ice-candidate", ({ peerId, candidate }) => {
      io.to(peerId).emit("voice:ice-candidate", { peerId: socket.id, candidate });
    });

    socket.on("disconnect", () => {
      socket.to(ROOM_NAME).emit("voice:peer-leave", { peerId: socket.id });
      roomPlayers.delete(socket.id);
      socket.to(ROOM_NAME).emit("player:left", { id: socket.id });
      syncVoicePairs(io, ROOM_NAME);

      if (roomPlayers.size === 0) {
        playersByRoom.delete(ROOM_NAME);
        voicePairsByRoom.delete(ROOM_NAME);
      }
    });
  });

  return io;
};

module.exports = {
  attachWorldSocket,
};
