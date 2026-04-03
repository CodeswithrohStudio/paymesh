# Getting Test USDC on Base Sepolia

To run the demo script, you need test USDC on Base Sepolia testnet.

## Agent Wallet Address (Buyer)
```
0x2bb9EFFe462B63dA3bafE817B277E05268913fB5
```

## Developer Wallet Address (Seller)
```
0xA1B320D8061357efa286Af2629DF6AC554C05d6E
```

## Option 1: Base Sepolia Faucet (Recommended)

1. Visit the official Base Sepolia faucet:
   https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

2. Connect your wallet or enter the agent address:
   ```
   0x2bb9EFFe462B63dA3bafE817B277E05268913fB5
   ```

3. Request test tokens (you'll get both ETH and USDC)

## Option 2: Bridge from Sepolia

If you have Sepolia ETH:

1. Get Sepolia ETH from: https://sepoliafaucet.com/
2. Bridge to Base Sepolia: https://bridge.base.org/
3. Swap for USDC on Base Sepolia testnet

## Option 3: Use a Different Wallet

If you have test USDC in another wallet:

1. Update the private key in `scripts/heyelsa-demo.ts`:
   ```typescript
   const AGENT_PRIVATE_KEY = 'YOUR_PRIVATE_KEY_HERE';
   ```

2. Make sure your wallet has:
   - At least 0.001 USDC (1000 units with 6 decimals)
   - Some Base Sepolia ETH for gas fees

## Verify Your Balance

Before running the demo, check your balance:

```bash
# The script will automatically check and display your USDC balance
npx tsx scripts/heyelsa-demo.ts
```

## USDC Contract Details

- **Contract Address:** `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Network:** Base Sepolia
- **Chain ID:** 84532
- **Decimals:** 6
- **Symbol:** USDC

## Required Amount

The demo requires:
- **0.001 USDC** (1000 units) for the payment
- **~0.0001 ETH** for gas fees

## Troubleshooting

### "Insufficient USDC balance"
- Get test USDC from the faucet above
- Make sure you're on Base Sepolia, not Ethereum Sepolia

### "Insufficient gas"
- Get Base Sepolia ETH from the faucet
- You need ETH for gas even though you're sending USDC

### "Transaction failed"
- Check that you have both USDC and ETH
- Verify you're connected to Base Sepolia (Chain ID: 84532)
- Try increasing gas limit

## Running the Demo

Once you have test USDC:

```bash
cd paymesh
npx tsx scripts/heyelsa-demo.ts
```

The script will:
1. Check your USDC balance
2. Call the protected API (receive 402)
3. Send 0.001 USDC to the developer wallet
4. Retry the API call with payment proof
5. Receive the protected data

## Security Note

⚠️ **NEVER use the demo private key in production!**

The private key in the demo script is for testing only. In production:
- Use secure key management (AWS KMS, HashiCorp Vault, etc.)
- Never commit private keys to git
- Use environment variables for sensitive data
- Consider using hardware wallets or MPC solutions
