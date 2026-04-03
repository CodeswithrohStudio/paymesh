import { NextRequest, NextResponse } from 'next/server'
import { getPublicApis } from '@/lib/db'
import { getSubdomainForWallet } from '@/lib/subdomain'

const CATEGORIES = ['All', 'Weather', 'Finance', 'AI', 'Data', 'Sports', 'News', 'Other']

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const query = searchParams.get('query') || ''
  const category = searchParams.get('category') || 'All'
  const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined
  const sortBy = (searchParams.get('sortBy') || 'price_asc') as 'price_asc' | 'popular'

  try {
    const apis = await getPublicApis({ query, category, maxPrice, sortBy })

    // Fetch subdomains for all unique developers in parallel
    const uniqueWallets = Array.from(new Set(apis.map((api: any) => api.pay_to)))
    const subdomainMap: Record<string, string | null> = {}
    
    await Promise.all(uniqueWallets.map(async (wallet) => {
      subdomainMap[wallet] = await getSubdomainForWallet(wallet as `0x${string}`)
    }))

    const results = apis.map((api: any) => ({
      id: api.id,
      // Mask endpoint — show domain only
      endpointMasked: maskEndpoint(api.endpoint),
      endpoint: api.endpoint,
      price: api.price,
      category: api.category || 'Other',
      description: api.description || '',
      tags: api.tags || [],
      totalCalls: api.total_calls || 0,
      reliabilityScore: api.reliability_score || 100,
      isPublic: api.is_public,
      developerWallet: api.developers?.wallet_address || api.pay_to,
      developerEns: api.developers?.ens_name || null,
      payTo: api.pay_to,
      paymeshSubdomain: subdomainMap[api.pay_to] || null,
    }))

    return NextResponse.json({ results, categories: CATEGORIES })
  } catch (error) {
    console.error('Marketplace search error:', error)
    return NextResponse.json({ results: [], categories: CATEGORIES })
  }
}

function maskEndpoint(endpoint: string): string {
  try {
    const url = new URL(endpoint)
    return `${url.hostname}/***`
  } catch {
    return '***'
  }
}
