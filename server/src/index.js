import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

import { verifyToken } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import listingRoutes from './routes/listings.js';
import userRoutes from './routes/users.js';
import pesticideRoutes from './routes/pesticides.js';
import { startPesticideSimulator } from './pesticideSimulator.js';

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '8mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'farmer-market-connect-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/pesticides', pesticideRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, credentials: true },
});

// Auth handshake: the client sends its JWT; we join per-user and per-role
// rooms so we can target realtime events (e.g. "notify this one farmer").
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      socket.data.auth = verifyToken(token);
    } catch {
      // invalid/expired token — allow the connection but treat as anonymous
    }
  }
  next();
});

io.on('connection', (socket) => {
  const auth = socket.data.auth;
  if (auth) {
    socket.join(`user:${auth.sub}`);
    socket.join(`role:${auth.role}`);
  }
  socket.on('disconnect', () => {});
});

app.set('io', io);

const stopSimulator = startPesticideSimulator(io);
process.on('SIGTERM', stopSimulator);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Farmer Market Connect API + realtime server on http://localhost:${PORT}`);
});
