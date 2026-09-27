# DCN Architecture Documentation

## Overview

DCN (Decentralized Compute & Network Infrastructure) is a distributed computing platform featuring Ring 24/7 Sentinel human verification and zero-knowledge proof security architecture.

## Core Components

### 1. Sentinel Ring Layer
The Ring 24/7 Sentinel system provides continuous monitoring and human verification:

- **Node Management**: Tracks and monitors sentinel nodes in the ring
- **Health Monitoring**: Continuous heartbeat checks with automatic recovery
- **Verification System**: Multi-signature human verification with approval/rejection flows
- **Event Emission**: Real-time event notifications for state changes

### 2. Zero-Knowledge Proof Engine
Privacy-preserving verification without revealing underlying data:

- **Circuit Management**: Loading and caching zk circuits
- **Proof Generation**: Creating cryptographic proofs from input data
- **Proof Verification**: Validating proofs against public signals
- **Fallback Mode**: Mock proofs when ZK verification is disabled

### 3. Network Layer
Decentralized P2P network communication:

- **Peer Management**: Adding, removing, and tracking connected peers
- **Message Routing**: Sending messages between network nodes
- **Status Tracking**: Connection status and message queue monitoring
- **Event Broadcasting**: Peer connection/disconnection events

### 4. API Layer
REST API for system interaction:

- Sentinel Ring operations (verify, approve, status)
- Network management (peers, status)
- ZK Proof operations (prove, verify)
- System status and health checks

## Data Flow

```
User Request
    ↓
API Router
    ↓
Component Handler
    ├─→ Sentinel Ring (for verification)
    ├─→ ZK Engine (for proof generation/verification)
    └─→ Network Layer (for P2P communication)
    ↓
Response
```

## Security Model

1. **Multi-Signature Verification**: All critical operations require multiple signatories
2. **Zero-Knowledge Proofs**: Privacy-preserving verification of data
3. **Network Resilience**: Distributed nodes with automatic failover
4. **Audit Trail**: All operations logged with timestamps

## Configuration

Environment variables control runtime behavior:

- `SENTINEL_RING_SIZE`: Number of sentinel nodes (default: 5)
- `SENTINEL_HEARTBEAT_INTERVAL`: Health check interval in ms (default: 60000)
- `ZK_VERIFICATION_ENABLED`: Enable ZK proof verification (default: false)
- `NODE_ENV`: Runtime environment (development/production)

## Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build:prod
npm start
```

### Docker
```bash
docker-compose up
```

## Future Enhancements

- [ ] Real snarkjs proof generation/verification
- [ ] libp2p P2P network integration
- [ ] Consensus mechanism implementation
- [ ] Smart contract integration
- [ ] Database persistence layer
- [ ] Advanced monitoring and metrics
