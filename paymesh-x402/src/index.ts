import { createPublicClient, http, parseUnits } from 'viem';
import { baseSepolia } from 'viem/chains';

const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const CHAIN_ID = 84532;

interface PayMeshConfig {
  apiKey: string;
  price: string;
  payTo: string;
  token?: string;
  network?: string;
}

interface PaymentHeader {
  txHash: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  network: string;
}

const client = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org')
});

// ERC-20 Transfer event signature
const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

function parse402Header(header: string): PaymentHeader | null {
  try {
    const parts = header.split(';');
    const result: any = {};
    parts.forEach(part => {
      const [key, value] = part.split('=');
      result[key.trim()] = value.trim();
    });
    return result as PaymentHeader;
  } catch {
    return null;
  }
}

async function verifyPayment(
  payment: PaymentHeader,
  expectedAmount: string,
  expectedTo: string
): Promise<boolean> {
  try {
    // Get transaction receipt
    const receipt: any = await client.getTransactionReceipt({
      hash: payment.txHash as `0x${string}`
    });

    if (!receipt || receipt.status !== 'success') {
      return false;
    }

    // Parse expected amount (USDC has 6 decimals)
    const expectedAmountUnits = parseUnits(expectedAmount, 6);

    // Find Transfer events
    for (const log of receipt.logs) {
      // Check if this log is from the USDC contract
      if (log.address.toLowerCase() !== USDC_ADDRESS.toLowerCase()) {
        continue;
      }

      // Check if this is a Transfer event
      if (log.topics[0] !== TRANSFER_EVENT_SIGNATURE) {
        continue;
      }

      // Decode Transfer event manually
      // topics[1] = from (indexed)
      // topics[2] = to (indexed)
      // data = amount
      const transferTo = '0x' + log.topics[2].slice(26); // Remove padding
      const transferAmount = BigInt(log.data);

      // Check if recipient matches and amount is sufficient
      if (
        transferTo.toLowerCase() === expectedTo.toLowerCase() &&
        transferAmount >= expectedAmountUnits
      ) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

function create402Response(config: PayMeshConfig) {
  return {
    status: 402,
    body: JSON.stringify({
      error: 'Payment Required',
      message: 'This API requires payment to access',
      payment: {
        amount: config.price,
        token: config.token || USDC_ADDRESS,
        network: config.network || 'base-sepolia',
        chainId: CHAIN_ID,
        payTo: config.payTo
      }
    })
  };
}

// Express middleware
export function paymesh(config: PayMeshConfig) {
  return async (req: any, res: any, next: any) => {
    const paymentHeader = req.headers['x-payment'];

    if (!paymentHeader) {
      const response = create402Response(config);
      return res.status(402).json(JSON.parse(response.body));
    }

    const payment = parse402Header(paymentHeader);
    if (!payment) {
      return res.status(402).json({ error: 'Invalid payment header' });
    }

    const isValid = await verifyPayment(
      payment,
      config.price,
      config.payTo
    );

    if (!isValid) {
      return res.status(402).json({ error: 'Payment verification failed' });
    }

    next();
  };
}

// Next.js middleware
export async function paymeshNext(
  request: Request,
  config: PayMeshConfig
): Promise<Response | null> {
  const paymentHeader = request.headers.get('x-payment');

  if (!paymentHeader) {
    const response = create402Response(config);
    return new Response(response.body, {
      status: 402,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const payment = parse402Header(paymentHeader);
  if (!payment) {
    return new Response(
      JSON.stringify({ error: 'Invalid payment header' }),
      { status: 402 }
    );
  }

  const isValid = await verifyPayment(
    payment,
    config.price,
    config.payTo
  );

  if (!isValid) {
    return new Response(
      JSON.stringify({ error: 'Payment verification failed' }),
      { status: 402 }
    );
  }

  return null;
}

export default paymesh;
