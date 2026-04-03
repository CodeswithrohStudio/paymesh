import { Client } from '@xmtp/xmtp-js';
import { providers } from 'ethers';

export async function initXmtp(walletAddress: string) {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error("No ethereum provider found in browser");
  }

  // Bind to Ethers because XMTP historically prefers Ethers V5 signers over Viem
  const provider = new providers.Web3Provider((window as any).ethereum);
  const signer = provider.getSigner(walletAddress);
  
  // Use DEV environment for the hackathon
  const xmtp = await Client.create(signer, { env: "dev" });
  return xmtp;
}

export async function sendCreatorNotification(xmtpClient: Client, creatorAddress: string, endpoint: string, amount: string) {
  try {
    const canMessage = await xmtpClient.canMessage(creatorAddress);
    
    // In a production environment, if canMessage is false, we'd fallback to another notification system
    // but for the hackathon we will attempt to send anyway or skip.
    if (!canMessage) {
      console.warn("Creator has not activated XMTP yet.");
      return false;
    }

    const conversation = await xmtpClient.conversations.newConversation(creatorAddress);
    await conversation.send(`✅ PayMesh Receipt: A user just bought access to your endpoint [${endpoint}] for ${amount} USDC.`);
    return true;
  } catch (error) {
    console.error("Failed to send XMTP notification:", error);
    return false;
  }
}
