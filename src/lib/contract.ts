// PayMesh Smart Contract - Base Sepolia
export const PAYMESH_CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_PAYMESH_CONTRACT || '0x3641c875C7f3e53F2369bA55A17C59F52F5af716'
) as `0x${string}`

export const USDC_ADDRESS = (
  process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
) as `0x${string}`

export const USDC_DECIMALS = 6

// PayMesh contract ABI
export const PAYMESH_ABI = [
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
  {
    name: 'feePercent',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
] as const

// ERC-20 USDC ABI (approve + allowance)
export const USDC_ABI = [
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
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

// Convert USDC amount string (e.g. "0.001") to on-chain units (e.g. 1000n)
export function toUSDCUnits(amount: string): bigint {
  const [whole, decimals = ''] = amount.split('.')
  const paddedDecimals = decimals.padEnd(USDC_DECIMALS, '0').slice(0, USDC_DECIMALS)
  return BigInt(whole) * BigInt(10 ** USDC_DECIMALS) + BigInt(paddedDecimals)
}

// ENS Subdomain Contract - Ethereum Sepolia
export const SUBDOMAIN_CONTRACT_ADDRESS = (
  process.env.PAYMESH_SUBDOMAIN_CONTRACT || '0xdF7CBC76A60A84566785179Eb1517D1058cbD72c'
) as `0x${string}`

export const SUBDOMAIN_ABI = [
  {
    name: 'createSubdomain',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'label', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
    outputs: [],
  },
  {
    name: 'getWallet',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'label', type: 'string' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'getSubdomain',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'wallet', type: 'address' }],
    outputs: [{ name: '', type: 'string' }],
  },
] as const
