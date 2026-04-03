import { NextRequest, NextResponse } from 'next/server'
import { verifyX402Payment } from '@/middleware/x402'
import { getApiById, getTransactionByHash, createTransaction } from '@/lib/db'
import { z } from 'zod'

const verifySchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  apiId: z.string(),
  amount: z.string(),
  from: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = verifySchema.parse(body)

    const api = await getApiById(data.apiId)
    if (!api) {
      return NextResponse.json({ error: 'API not found' }, { status: 404 })
    }

    // Return early if already verified
    const existing = await getTransactionByHash(data.txHash)
    if (existing) {
      return NextResponse.json({ verified: existing.verified, transaction: existing })
    }

    const isValid = await verifyX402Payment(data.txHash, data.amount, data.to)

    const transaction = await createTransaction({
      api_id: data.apiId,
      tx_hash: data.txHash,
      amount: data.amount,
      from_address: data.from,
      to_address: data.to,
      verified: isValid,
    })

    return NextResponse.json({ verified: isValid, transaction })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    console.error('Verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
