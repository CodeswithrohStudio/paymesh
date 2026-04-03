export interface Developer {
  id: string;
  email: string;
  walletAddress: string;
  ensName?: string;
  createdAt: Date;
}

export interface ApiEndpoint {
  id: string;
  developerId: string;
  endpoint: string;
  price: string;
  enabled: boolean;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  apiId: string;
  txHash: string;
  amount: string;
  from: string;
  to: string;
  verified: boolean;
  createdAt: Date;
}

export interface X402Header {
  amount: string;
  token: string;
  network: string;
  txHash: string;
  from: string;
  to: string;
}

export interface ApiConfig {
  price: string;
  payTo: string;
  enabled: boolean;
}

export interface PaymentInfo {
  amount: string;
  token: string;
  network: string;
  chainId: number;
  payTo: string;
}

export interface StreamInfo {
  sender: string;
  receiver: string;
  flowRate: string;
  token: string;
  network: string;
}
