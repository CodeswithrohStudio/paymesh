import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'

const USDCX_ADDRESS = '0x8430F084B939208E2eDEd1584889C9A66B90562f'
const SUPERFLUID_HOST = '0x6836F23d6171D74Ef62FcF776655aBcD2bcd62Ef' // Base Sepolia host

// Superfluid subgraph for Base Sepolia
const SUBGRAPH_URL = 'https://subgraph-endpoints.superfluid.dev/base-sepolia/protocol-v1'

// Convert USDC/month to flow rate (wei per second)
// USDCx has 18 decimals
export function monthlyToFlowRate(usdcPerMonth: number): string {
  const perSecond = (usdcPerMonth * 1e18) / (30 * 24 * 3600)
  return Math.floor(perSecond).toString()
}

export function flowRateToMonthly(flowRate: string): number {
  return (Number(flowRate) * 30 * 24 * 3600) / 1e18
}

// GET — fetch active streams for a wallet address
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const wallet = searchParams.get('wallet')

  if (!wallet) {
    return NextResponse.json({ error: 'wallet param required' }, { status: 400 })
  }

  try {
    const query = `{
      streams(
        where: {
          sender: "${wallet.toLowerCase()}"
          token: "${USDCX_ADDRESS.toLowerCase()}"
          currentFlowRate_gt: "0"
        }
      ) {
        id
        receiver { id }
        currentFlowRate
        streamedUntilUpdatedAt
        updatedAtTimestamp
      }
    }`

    const res = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })

    const { data } = await res.json()
    const streams = (data?.streams || []).map((s: any) => ({
      id: s.id,
      receiver: s.receiver.id,
      flowRate: s.currentFlowRate,
      monthlyAmount: flowRateToMonthly(s.currentFlowRate).toFixed(4),
    }))

    return NextResponse.json({ streams, count: streams.length })
  } catch (error) {
    console.error('Stream fetch error:', error)
    return NextResponse.json({ streams: [], count: 0 })
  }
}

// POST — return the calldata needed to create a stream
// Actual signing happens client-side via connected wallet
export async function POST(request: NextRequest) {
  try {
    const { sender, receiver, usdcPerMonth } = await request.json()

    if (!sender || !receiver || !usdcPerMonth) {
      return NextResponse.json({ error: 'sender, receiver, usdcPerMonth required' }, { status: 400 })
    }

    const flowRate = monthlyToFlowRate(Number(usdcPerMonth))

    // Return the flow rate and contract details for client-side execution
    return NextResponse.json({
      success: true,
      flowRate,
      monthlyAmount: usdcPerMonth,
      token: USDCX_ADDRESS,
      host: SUPERFLUID_HOST,
      sender,
      receiver,
      network: 'base-sepolia',
      chainId: 84532,
    })
  } catch (error) {
    console.error('Stream create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
