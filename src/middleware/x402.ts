import { NextRequest, NextResponse } from 'next/server';
export { x402Middleware as paymeshNext };
import { createPublicClient, http, parseUnits, decodeEventLog, parseAbiItem } from 'viem';
import { baseSepolia } from 'viem/chains';
import { resolvePayMeshId } from '@/lib/resolver';

const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
const PAYMESH_CONTRACT = '0xE417b19994eB207E8434e6ba147C90D5a3C38Aa6'

interface X402Header {
  amount: string;
  token: string;
  network: string;
  txHash: string;
  from: string;
  to: string;
}

interface ApiConfig {
  price: string;
  payTo: string;
  enabled: boolean;
}

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
});

// ERC-20 Transfer event ABI
const TRANSFER_EVENT_ABI = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

export async function verifyX402Payment(
  txHash: string,
  expectedAmount: string,
  payTo: string
): Promise<boolean> {
  try {
    console.log('\n🔍 Verifying payment...');
    console.log('TX Hash:', txHash);
    console.log('Expected Amount:', expectedAmount, 'USDC');
    const resolvedPayTo = await resolvePayMeshId(payTo);
    if (!resolvedPayTo) {
      console.error('❌ Could not resolve payTo address:', payTo);
      return false;
    }

    console.log('Expected Recipient:', resolvedPayTo, payTo !== resolvedPayTo ? `(${payTo})` : '');
    const finalPayTo = resolvedPayTo;

    // Get transaction receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    if (!receipt) {
      console.error('❌ Transaction receipt not found');
      return false;
    }

    if (receipt.status !== 'success') {
      console.error('❌ Transaction failed on-chain');
      return false;
    }

    console.log('✓ Transaction confirmed on-chain');

    // Parse the expected amount (USDC has 6 decimals)
    const expectedAmountUnits = parseUnits(expectedAmount, 6);
    console.log('Expected Amount (units):', expectedAmountUnits.toString());

    // Find and decode Transfer events
    let transferFound = false;
    
    for (const log of receipt.logs) {
      // Check if this log is from the USDC contract
      if (log.address.toLowerCase() !== USDC_ADDRESS.toLowerCase()) {
        continue;
      }

      try {
        // Decode the Transfer event
        const decodedLog = decodeEventLog({
          abi: [TRANSFER_EVENT_ABI],
          data: log.data,
          topics: log.topics,
        });

        console.log('\n📝 Transfer Event Found:');
        console.log('  From:', decodedLog.args.from);
        console.log('  To:', decodedLog.args.to);
        console.log('  Amount (units):', decodedLog.args.value.toString());

        // Verify the transfer details
        const transferTo = decodedLog.args.to as string
        const transferAmount = decodedLog.args.value as bigint

        // Accept transfer to developer wallet OR to PayMesh contract (which forwards to developer)
        const isToDevWallet = transferTo.toLowerCase() === finalPayTo.toLowerCase()
        const isToContract = transferTo.toLowerCase() === PAYMESH_CONTRACT.toLowerCase()

        if (isToDevWallet || isToContract) {
          console.log('✓ Recipient matches', isToContract ? '(via PayMesh contract)' : '(direct)')

          if (transferAmount >= expectedAmountUnits) {
            console.log('✓ Amount is sufficient')
            console.log('✅ Payment verification successful!\n')
            transferFound = true
            break
          } else {
            console.log('❌ Amount insufficient:', transferAmount.toString(), '<', expectedAmountUnits.toString())
          }
        } else {
          console.log('❌ Recipient mismatch:', transferTo)
        }
      } catch (decodeError) {
        // Not a Transfer event or different event signature, skip
        continue;
      }
    }

    if (!transferFound) {
      console.error('❌ No valid USDC transfer found in transaction logs\n');
    }

    return transferFound;
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    return false;
  }
}

export function parseX402Header(header: string): X402Header | null {
  try {
    const parts = header.split(';').map(p => p.trim());
    const parsed: any = {};
    
    parts.forEach(part => {
      const [key, value] = part.split('=').map(s => s.trim());
      parsed[key] = value;
    });

    return {
      amount: parsed.amount,
      token: parsed.token,
      network: parsed.network,
      txHash: parsed.txHash,
      from: parsed.from,
      to: parsed.to,
    };
  } catch {
    return null;
  }
}

export function createX402Response(config: ApiConfig, request: NextRequest): NextResponse {
  // Detect browser requests — redirect to checkout UI instead of raw JSON
  const acceptHeader = request.headers.get('accept') || ''
  const isBrowser = acceptHeader.includes('text/html')

  if (isBrowser) {
    const checkoutUrl = new URL(
      `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/checkout`
    )
    checkoutUrl.searchParams.set('amount', config.price)
    checkoutUrl.searchParams.set('payTo', config.payTo)
    checkoutUrl.searchParams.set('network', 'base-sepolia')
    checkoutUrl.searchParams.set('api', request.nextUrl.href)
    return NextResponse.redirect(checkoutUrl)
  }

  const response = NextResponse.json(
    {
      error: 'Payment Required',
      message: 'This API requires payment to access',
      payment: {
        amount: config.price,
        token: USDC_ADDRESS,
        network: 'base-sepolia',
        chainId: 84532,
        payTo: config.payTo,
      },
    },
    { status: 402 }
  )

  response.headers.set(
    'X-Payment-Required',
    `amount=${config.price};token=${USDC_ADDRESS};network=base-sepolia;payTo=${config.payTo}`
  )

  return response
}

export async function x402Middleware(
  request: NextRequest,
  config: ApiConfig
): Promise<NextResponse | null> {
  if (!config.enabled) {
    return null; // Pass through
  }

  const paymentHeader = request.headers.get('X-Payment')
    || request.headers.get('x-payment')
    || request.nextUrl.searchParams.get('x_payment')
    || request.nextUrl.searchParams.get('X-Payment');

  if (!paymentHeader) {
    return createX402Response(config, request)
  }

  const payment = parseX402Header(paymentHeader);

  if (!payment) {
    return NextResponse.json(
      { error: 'Invalid payment header format' },
      { status: 400 }
    );
  }

  // Verify payment on-chain
  const isValid = await verifyX402Payment(
    payment.txHash,
    config.price,
    config.payTo
  );

  if (!isValid) {
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 402 }
    );
  }

  // Payment verified, allow request through
  return null;
}
