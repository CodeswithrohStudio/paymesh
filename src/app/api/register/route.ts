import { NextRequest, NextResponse } from 'next/server'
import { getDeveloperByEmail, createDeveloper, createApi } from '@/lib/db'
import { resolveENS } from '@/lib/ens'
import { createENSSubdomain } from '@/lib/subdomain'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  ensName: z.string().optional(),
  endpoint: z.string().url(),
  price: z.string(),
  category: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  paymeshLabel: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    // Verify ENS if provided
    if (data.ensName) {
      const resolvedAddress = await resolveENS(data.ensName)
      if (!resolvedAddress || resolvedAddress.toLowerCase() !== data.walletAddress.toLowerCase()) {
        return NextResponse.json(
          { error: 'ENS name does not match wallet address' },
          { status: 400 }
        )
      }
    }

    // Create or get developer
    let developer = await getDeveloperByEmail(data.email)
    if (!developer) {
      developer = await createDeveloper({
        email: data.email,
        wallet_address: data.walletAddress,
        ens_name: data.ensName,
      })
    }

    // Create API — pay_to is the developer's wallet (whoever registered)
    const api = await createApi({
      developer_id: developer.id,
      endpoint: data.endpoint,
      price: data.price,
      pay_to: data.walletAddress,
      category: data.category || 'Other',
      description: data.description || '',
      tags: data.tags || [],
      is_public: data.isPublic ?? true,
      enabled: true,
    })

    // Create ENS Subdomain
    const label = (data.paymeshLabel || data.email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]/g, '');
    const subdomain = await createENSSubdomain(label, data.walletAddress as `0x${string}`);
    console.log(`Registration: Created subdomain ${subdomain} for ${data.walletAddress}`);

    return NextResponse.json({
      success: true,
      apiId: api.id,
      paymeshSubdomain: subdomain,
      developer: {
        id: developer.id,
        email: developer.email,
        walletAddress: developer.wallet_address,
        ensName: developer.ens_name,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
