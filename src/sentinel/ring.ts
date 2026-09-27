import { Logger } from '../utils/logger';
import { EventEmitter } from 'events';

export interface SentinelConfig {
  ringSize: number;
  heartbeatInterval: number;
}

export interface SentinelNode {
  id: string;
  address: string;
  status: 'active' | 'inactive' | 'monitoring';
  lastHeartbeat: number;
}

export interface VerificationRequest {
  id: string;
  data: unknown;
  signatories: string[];
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
}

/**
 * Ring 24/7 Sentinel System
 * Provides continuous monitoring and multi-signature human verification
 */
export class SentinelRing extends EventEmitter {
  private config: SentinelConfig;
  private logger: Logger;
  private nodes: Map<string, SentinelNode>;
  private verificationRequests: Map<string, VerificationRequest>;
  private heartbeatTimer: NodeJS.Timeout | null;
  private isRunning: boolean;

  constructor(config: SentinelConfig) {
    super();
    this.config = config;
    this.logger = new Logger('SentinelRing');
    this.nodes = new Map();
    this.verificationRequests = new Map();
    this.heartbeatTimer = null;
    this.isRunning = false;
  }

  /**
   * Initialize the Sentinel Ring
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing Sentinel Ring', {
      ringSize: this.config.ringSize,
      heartbeatInterval: this.config.heartbeatInterval,
    });

    // Initialize sentinel nodes
    for (let i = 0; i < this.config.ringSize; i++) {
      const node: SentinelNode = {
        id: `sentinel-${i}`,
        address: `sentinel-${i}.local`,
        status: 'active',
        lastHeartbeat: Date.now(),
      };
      this.nodes.set(node.id, node);
      this.logger.debug(`Registered sentinel node: ${node.id}`);
    }

    this.isRunning = true;
    this.startHeartbeat();
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.checkNodeHealth();
    }, this.config.heartbeatInterval);

    this.logger.info('Heartbeat monitoring started');
  }

  /**
   * Check health of all nodes
   */
  private checkNodeHealth(): void {
    const now = Date.now();
    const timeout = this.config.heartbeatInterval * 2;

    for (const [id, node] of this.nodes) {
      if (now - node.lastHeartbeat > timeout) {
        if (node.status === 'active') {
          node.status = 'monitoring';
          this.logger.warn(`Node ${id} missed heartbeat, entering monitoring`);
          this.emit('node-health-warning', { nodeId: id, status: node.status });
        }
      } else if (node.status === 'monitoring') {
        node.status = 'active';
        this.logger.info(`Node ${id} recovered`);
        this.emit('node-recovered', { nodeId: id });
      }
    }
  }

  /**
   * Submit a verification request
   */
  async submitVerification(data: unknown, signatories: string[]): Promise<string> {
    const requestId = `verify-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const request: VerificationRequest = {
      id: requestId,
      data,
      signatories,
      timestamp: Date.now(),
      status: 'pending',
    };

    this.verificationRequests.set(requestId, request);
    this.logger.info(`Verification request submitted: ${requestId}`, {
      signatories: signatories.length,
    });

    this.emit('verification-submitted', { requestId, signatories });

    return requestId;
  }

  /**
   * Approve a verification request
   */
  async approveVerification(requestId: string, approver: string): Promise<void> {
    const request = this.verificationRequests.get(requestId);
    
    if (!request) {
      throw new Error(`Verification request not found: ${requestId}`);
    }

    if (request.status !== 'pending') {
      throw new Error(`Invalid request status: ${request.status}`);
    }

    if (!request.signatories.includes(approver)) {
      throw new Error(`Approver not in signatories list: ${approver}`);
    }

    request.status = 'approved';
    this.logger.info(`Verification approved: ${requestId} by ${approver}`);
    this.emit('verification-approved', { requestId, approver });
  }

  /**
   * Reject a verification request
   */
  async rejectVerification(requestId: string, rejecter: string, reason: string): Promise<void> {
    const request = this.verificationRequests.get(requestId);
    
    if (!request) {
      throw new Error(`Verification request not found: ${requestId}`);
    }

    if (request.status !== 'pending') {
      throw new Error(`Invalid request status: ${request.status}`);
    }

    request.status = 'rejected';
    this.logger.info(`Verification rejected: ${requestId} by ${rejecter}`, { reason });
    this.emit('verification-rejected', { requestId, rejecter, reason });
  }

  /**
   * Get verification status
   */
  getVerificationStatus(requestId: string): VerificationRequest | undefined {
    return this.verificationRequests.get(requestId);
  }

  /**
   * Get all active nodes
   */
  getActiveNodes(): SentinelNode[] {
    return Array.from(this.nodes.values()).filter(n => n.status === 'active');
  }

  /**
   * Get ring status
   */
  getRingStatus(): {
    isRunning: boolean;
    activeNodes: number;
    totalNodes: number;
    pendingVerifications: number;
  } {
    return {
      isRunning: this.isRunning,
      activeNodes: this.getActiveNodes().length,
      totalNodes: this.nodes.size,
      pendingVerifications: Array.from(this.verificationRequests.values())
        .filter(v => v.status === 'pending').length,
    };
  }

  /**
   * Shutdown the Sentinel Ring
   */
  async shutdown(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    this.isRunning = false;
    this.logger.info('Sentinel Ring shut down');
  }
}
