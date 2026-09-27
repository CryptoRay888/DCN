import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Logger } from './utils/logger';
import { SentinelRing } from './sentinel/ring';
import { ZKProofEngine } from './zk/engine';
import { NetworkLayer } from './network/layer';
import { APIRouter } from './api/router';

dotenv.config();

const logger = new Logger('DCN');
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize components
let sentinelRing: SentinelRing;
let zkEngine: ZKProofEngine;
let networkLayer: NetworkLayer;

/**
 * Initialize all DCN components
 */
async function initializeComponents(): Promise<void> {
  try {
    logger.info('Initializing DCN components...');

    // Initialize Sentinel Ring
    sentinelRing = new SentinelRing({
      ringSize: parseInt(process.env.SENTINEL_RING_SIZE || '5'),
      heartbeatInterval: parseInt(process.env.SENTINEL_HEARTBEAT_INTERVAL || '60000'),
    });
    await sentinelRing.initialize();
    logger.info('✓ Sentinel Ring initialized');

    // Initialize ZK Proof Engine
    zkEngine = new ZKProofEngine({
      circuitPath: process.env.ZK_CIRCUIT_PATH || './zk/circuits',
      provingKeyPath: process.env.ZK_PROVING_KEY_PATH || './zk/keys',
      enabled: process.env.ZK_VERIFICATION_ENABLED === 'true',
    });
    await zkEngine.initialize();
    logger.info('✓ ZK Proof Engine initialized');

    // Initialize Network Layer
    networkLayer = new NetworkLayer({
      listenAddresses: ['/ip4/127.0.0.1/tcp/30333'],
    });
    await networkLayer.start();
    logger.info('✓ Network Layer initialized');

    logger.info('All components initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize components', error);
    process.exit(1);
  }
}

/**
 * Setup API routes
 */
function setupRoutes(): void {
  const apiRouter = new APIRouter();
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // API routes
  app.use('/api/v1', apiRouter.getRouter());
}

/**
 * Start the application
 */
async function start(): Promise<void> {
  try {
    // Initialize components
    await initializeComponents();

    // Setup routes
    setupRoutes();

    // Start server
    const port = parseInt(process.env.PORT || '3000');
    app.listen(port, () => {
      logger.info(`DCN Server running on port ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start DCN', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  if (sentinelRing) await sentinelRing.shutdown();
  if (networkLayer) await networkLayer.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  if (sentinelRing) await sentinelRing.shutdown();
  if (networkLayer) await networkLayer.stop();
  process.exit(0);
});

// Start the application
start();
