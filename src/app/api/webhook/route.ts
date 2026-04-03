import { NextRequest, NextResponse } from 'next/server'
import { verifyX402Payment } from '@/middleware/x402'
import { getApiById, getTransactionByHash, createTransaction } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { txHash, apiId } = await request.json()

    if (!txHash || !apiId) {
      return NextResponse.json({ error: 'txHash and apiId required' }, { status: 400 })
    }

    const api = await getApiById(apiId)
    if (!api) {
      return NextResponse.json({ error: 'API not found' }, { status: 404 })
    }

    const existing = await getTransactionByHash(txHash)
    if (existing) {
      return NextResponse.json({ verified: existing.verified })
    }

    const isValid = await verifyX402Payment(txHash, api.price, api.pay_to)

    await createTransaction({
      api_id: apiId,
      tx_hash: txHash,
      amount: api.price,
      from_address: '',
      to_address: api.pay_to,
      verified: isValid,
    })

    return NextResponse.json({ verified: isValid })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
