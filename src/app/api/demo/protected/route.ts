import { NextRequest, NextResponse } from 'next/server'
import { x402Middleware } from '@/middleware/x402'
import { getApiByEndpoint } from '@/lib/db'

export async function GET(request: NextRequest) {
  const endpoint = `${request.nextUrl.origin}/api/demo/protected`
  const registeredApi = await getApiByEndpoint(endpoint)

  const API_CONFIG = {
    price: registeredApi?.price || '0.001',
    payTo: registeredApi?.pay_to || process.env.NEXT_PUBLIC_DEVELOPER_WALLET || '0xA1B320D8061357efa286Af2629DF6AC554C05d6E',
    enabled: true,
  }

  const paymentCheck = await x402Middleware(request, API_CONFIG)
  if (paymentCheck) return paymentCheck

  return NextResponse.json({
    success: true,
    message: 'Welcome to the protected API!',
    data: {
      timestamp: new Date().toISOString(),
      paidTo: API_CONFIG.payTo,
      weather: {
        location: 'San Francisco',
        temperature: 72,
        condition: 'Sunny',
      },
      tip: `You paid ${API_CONFIG.price} USDC to access this data via x402 protocol`,
    },
  })
}
