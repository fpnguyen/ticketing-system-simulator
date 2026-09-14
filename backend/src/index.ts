import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { env } from './config/env.js';
import './config/firebase.js';
import { apiRouter } from './api/rest.js';
import { initRealtime } from './realtime/socket.js';
import { wireFirestorePersistence } from './persistence/wireEvents.js';
import { logger } from './utils/logger.js';

const app = express();
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', apiRouter);

const httpServer = createServer(app);
initRealtime(httpServer);
wireFirestorePersistence();

httpServer.listen(env.PORT, () => {
  logger.info(`Backend listening on port ${env.PORT}`);
});
