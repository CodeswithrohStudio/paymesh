#!/usr/bin/env node

/**
 * Heyelsa AI Agent Demo
 * Demonstrates x402 payment flow using PayMesh smart contract
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createPublicClient, createWalletClient, http, parseUnits } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Load .env.local from the parent directory (paymesh/)
config({ path: resolve(__dirname, '../.env.local') });

const DEMO_API_URL = 'https://paymesh-alpha.vercel.app/api/demo/protected';

const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`;
const PAYMESH_CONTRACT = '0xE417b19994eB207E8434e6ba147C90D5a3C38Aa6' as `0x${string}`;
const DEVELOPER_WALLET = '0xA1B320D8061357efa286Af2629DF6AC554C05d6E' as `0x${string}`;
const PAYMENT_AMOUNT = '0.001'; // USDC
const PAYMENT_UNITS = parseUnits(PAYMENT_AMOUNT, 6); // 1000 units

// Validate AGENT_PRIVATE_KEY
if (!process.env.AGENT_PRIVATE_KEY) {
  console.error('❌ ERROR: AGENT_PRIVATE_KEY is not set!\n');
  console.error('Please set your private key in .env.local:');
  console.error('  AGENT_PRIVATE_KEY=your_private_key_here\n');
  process.exit(1);
}

const rawKey = process.env.AGENT_PRIVATE_KEY;
const AGENT_PRIVATE_KEY = (rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`) as `0x${string}`;

// ABIs
const USDC_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

const PAYMESH_ABI = [
  {
    name: 'processPayment',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'developer', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

async function main() {
  console.log('🤖 Heyelsa AI Agent - x402 Payment Demo\n');
  console.log('═══════════════════════════════════════\n');

  const account = privateKeyToAccount(AGENT_PRIVATE_KEY);
  console.log(`Agent Wallet: ${account.address}`);

  const EXPECTED_AGENT_ADDRESS = '0x2bb9EFFe462B63dA3bafE817B277E05268913fB5';
  if (account.address.toLowerCase() !== EXPECTED_AGENT_ADDRESS.toLowerCase()) {
    console.log(`⚠️  WARNING: Agent wallet address mismatch!`);
    console.log(`   Expected: ${EXPECTED_AGENT_ADDRESS}`);
    console.log(`   Got: ${account.address}\n`);
  } else {
    console.log(`✓ Agent wallet verified\n`);
  }

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http('https://sepolia.base.org'),
  });

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http('https://sepolia.base.org'),
  });

  // Check USDC balance
  console.log('Checking USDC balance...');
  const balance = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });

  const balanceFormatted = Number(balance) / 1e6;
  console.log(`✓ USDC Balance: ${balanceFormatted} USDC\n`);

  if (balance < PAYMENT_UNITS) {
    console.log('⚠️  Insufficient USDC balance! Need at least 0.001 USDC.');
    return;
  }

  // Step 1: Call API without payment
  console.log('Step 1: Calling API without payment...');
  const response1 = await fetch(DEMO_API_URL);

  if (response1.status !== 402) {
    console.log('Unexpected response:', response1.status);
    return;
  }

  console.log('✓ Received 402 Payment Required\n');
  const paymentInfo = await response1.json();
  console.log('Payment Details:');
  console.log(`  Amount: ${paymentInfo.payment.amount} USDC`);
  console.log(`  Pay To: ${paymentInfo.payment.payTo}`);
  console.log(`  Contract: ${PAYMESH_CONTRACT}\n`);

  // Step 2: Approve USDC spending
  console.log('Step 2: Approving USDC for PayMesh contract...');
  const approveTx = await walletClient.writeContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'approve',
    args: [PAYMESH_CONTRACT, PAYMENT_UNITS],
  });

  console.log(`  Approve tx: ${approveTx}`);
  await publicClient.waitForTransactionReceipt({ hash: approveTx });
  console.log('✓ USDC approval confirmed\n');

  // Step 3: Call processPayment on contract
  console.log('Step 3: Calling processPayment on PayMesh contract...');
  console.log(`  Developer: ${DEVELOPER_WALLET}`);
  console.log(`  Amount: ${PAYMENT_UNITS} units (${PAYMENT_AMOUNT} USDC)`);

  const payTx = await walletClient.writeContract({
    address: PAYMESH_CONTRACT,
    abi: PAYMESH_ABI,
    functionName: 'processPayment',
    args: [DEVELOPER_WALLET, PAYMENT_UNITS],
  });

  console.log(`  Payment tx: ${payTx}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: payTx });
  console.log(`✓ Payment confirmed in block ${receipt.blockNumber}\n`);

  // Step 4: Call API with payment proof
  console.log('Step 4: Calling API with payment proof...');
  const xPayment = [
    `amount=${PAYMENT_AMOUNT}`,
    `token=${USDC_ADDRESS}`,
    `network=base-sepolia`,
    `txHash=${payTx}`,
    `from=${account.address}`,
    `to=${DEVELOPER_WALLET}`,
  ].join(';');

  const response2 = await fetch(DEMO_API_URL, {
    headers: { 'X-Payment': xPayment },
  });

  if (response2.ok) {
    const data = await response2.json();
    console.log('✓ Payment verified! API response:\n');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n🎉 Success! AI agent completed x402 payment via PayMesh contract\n');
    console.log(`View on BaseScan: https://sepolia.basescan.org/tx/${payTx}`);
    console.log('\n─────────────────────────────────────────────────');
    console.log('💡 Alternative: Superfluid streaming payments');
    console.log('   Instead of paying per API call, open a continuous stream:');
    console.log('   • Wrap USDC → USDCx at https://app.superfluid.finance');
    console.log('   • Start a stream: 10 USDCx/month → developer wallet');
    console.log('   • Get unlimited API access while stream is active');
    console.log('   • Cancel anytime — pay only for what you use');
    console.log('─────────────────────────────────────────────────\n');
  } else {
    const errorData = await response2.json();
    console.log('✗ Payment verification failed');
    console.log('Response:', errorData);
  }
}

main().catch(console.error);
