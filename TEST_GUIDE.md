# 🧪 PayMesh: End-to-End Testing Guide (v1.0)

Follow these steps to create a new API, monetise it, and call it using the deployed URL.

---

## Step 1: Create a Monetised API Route
Create a new file in your project (e.g., `src/app/api/premium-data/route.ts`) and add the protection middleware.

```typescript
import { paymeshNext } from 'paymesh-x402';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // 1. Check if the user has paid
  const paymentRequired = await paymeshNext(request, {
    price: '0.001',           // Amount in USDC
    payTo: '0xYourWalletAddress', // YOUR actual wallet address
  });

  // 2. If unpaid, this returns the 402 response
  if (paymentRequired) return paymentRequired;

  // 3. Protected Content (Only accessible after payment)
  return NextResponse.json({
    success: true,
    data: "This content is unlocked! You paid 0.001 USDC on Base Sepolia.",
    secret_key: "AGENT_ALPHA_99"
  });
}
```

---

## Step 2: Register on Marketplace
Since your project is deployed on Vercel:
1.  Go to your deployed URL (e.g., `https://your-project.vercel.app/dashboard`).
2.  Connect your wallet.
3.  Go to **"Register API"** tab.
4.  Enter your new endpoint: `https://your-project.vercel.app/api/premium-data`.
5.  Set price as `0.001` USDC.
6.  Click **Submit**. Your API is now discoverable!

---

## Step 3: Test as a Human (Browser)
1.  Navigate to your deployed **Marketplace** page.
2.  Find your `premium-data` API.
3.  Click **"Try API"**.
4.  You will be redirected to the **Checkout** page. 
5.  Complete the USDC payment on **Base Sepolia**.
6.  Once confirmed, the UI will redirect you back to the API, and you will see the JSON data.

---

## Step 4: Test as an Agent (cURL / Postman)
This is how an AI agent actually "talks" to your API.

### A. Initial Call (Should Fail)
```bash
curl -i https://your-project.vercel.app/api/premium-data
```
**Expected Result**: `402 Payment Required` with headers containing `x-paymesh-payto` and `x-paymesh-amount`.

### B. Make the Payment
Send `0.001` USDC to the `payTo` address on the **Base Sepolia** network using your wallet (MetaMask/Coinbase). Copy the **Transaction Hash**.

### C. Call with Payment Proof (Should Succeed)
Replace `TX_HASH` with your real hash and `YOUR_WALLET` with your sender address.
```bash
curl -H "X-Payment: amount=0.001;token=0x036CbD53842c5426634e7929541eC2318f3dCF7e;network=base-sepolia;txHash=TX_HASH;from=YOUR_WALLET" \
     https://your-project.vercel.app/api/premium-data
```
**Expected Result**: `200 OK` with your secret data!

---

## 🛠 Troubleshooting
- **Network**: Ensure you are using **Base Sepolia** (Chain ID: 84532).
- **Token**: Ensure you are sending the correct testnet USDC (`0x036CbD53842c5426634e7929541eC2318f3dCF7e`).
- **Middleware**: Double-check that your `payTo` address in the code matches the address you are sending funds to.
