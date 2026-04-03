import { NextRequest, NextResponse } from 'next/server'
import { getPublicApis } from '@/lib/db'

// AI agent discovery endpoint
// GET /api/marketplace/discover?need=weather&budget=0.001
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const need = searchParams.get('need') || ''
  const budget = searchParams.get('budget') ? parseFloat(searchParams.get('budget')!) : undefined

  try {
    const apis = await getPublicApis({
      query: need,
      maxPrice: budget,
      sortBy: 'popular',
    })

    if (!apis.length) {
      return NextResponse.json(
        { error: 'No matching APIs found', need, budget },
        { status: 404 }
      )
    }

    // Return best match (most popular within budget)
    const best = apis[0] as any

    return NextResponse.json({
      endpoint: best.endpoint,
      price: best.price,
      payTo: best.pay_to,
      category: best.category || 'Other',
      description: best.description || '',
      reliability: `${best.reliability_score || 100}%`,
      totalCalls: best.total_calls || 0,
      network: 'base-sepolia',
      chainId: 84532,
      token: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      contract: '0xE417b19994eB207E8434e6ba147C90D5a3C38Aa6',
      // Instructions for AI agent
      howToPay: {
        step1: `Approve USDC: call approve(${process.env.NEXT_PUBLIC_PAYMESH_CONTRACT}, amount) on USDC contract`,
        step2: `Pay: call processPayment(${best.pay_to}, amount) on PayMesh contract`,
        step3: `Retry request with header: X-Payment: amount=${best.price};token=0x036CbD53842c5426634e7929541eC2318f3dCF7e;network=base-sepolia;txHash=<TX>;from=<YOUR_WALLET>;to=${best.pay_to}`,
      },
    })
  } catch (error) {
    console.error('Discover error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
