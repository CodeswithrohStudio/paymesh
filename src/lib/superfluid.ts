import { Framework } from '@superfluid-finance/sdk-core';
import { ethers } from 'ethers';

const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';

export class SuperfluidManager {
  private framework: Framework | null = null;
  private provider: ethers.providers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(BASE_SEPOLIA_RPC);
  }

  async initialize() {
    if (this.framework) return this.framework;

    this.framework = await Framework.create({
      chainId: 84532,
      provider: this.provider,
    });

    return this.framework;
  }

  async createStream(
    senderAddress: string,
    receiverAddress: string,
    flowRatePerSecond: string
  ) {
    const sf = await this.initialize();

    // In production, this would be called with a signer
    // For now, returning the operation details
    return {
      sender: senderAddress,
      receiver: receiverAddress,
      flowRate: flowRatePerSecond,
      token: USDC_ADDRESS,
      network: 'base-sepolia',
    };
  }

  async getStream(senderAddress: string, receiverAddress: string) {
    const sf = await this.initialize();

    try {
      // Get flow info
      const flow = await sf.cfaV1.getFlow({
        superToken: USDC_ADDRESS,
        sender: senderAddress,
        receiver: receiverAddress,
        providerOrSigner: this.provider,
      });

      return {
        flowRate: flow.flowRate,
        deposit: flow.deposit,
        owedDeposit: flow.owedDeposit,
        timestamp: flow.timestamp,
      };
    } catch (error) {
      console.error('Failed to get stream:', error);
      return null;
    }
  }

  async deleteStream(senderAddress: string, receiverAddress: string) {
    const sf = await this.initialize();

    // In production, this would be called with a signer
    return {
      sender: senderAddress,
      receiver: receiverAddress,
      action: 'delete',
    };
  }

  calculateFlowRate(usdcPerMonth: number): string {
    // Convert monthly USDC to per-second flow rate
    // USDC has 6 decimals
    const secondsPerMonth = 30 * 24 * 60 * 60;
    const flowRate = (usdcPerMonth * 1e6) / secondsPerMonth;
    return Math.floor(flowRate).toString();
  }
}

export const superfluidManager = new SuperfluidManager();
