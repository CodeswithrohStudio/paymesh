import { NextRequest, NextResponse } from 'next/server'
import { getDeveloperByWallet, getApisByDeveloper, getTransactionsByDeveloper, getTotalEarnings } from '@/lib/db'
import { getSubdomainForWallet } from '@/lib/subdomain'

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params

    const [developer, paymeshSubdomain] = await Promise.all([
      getDeveloperByWallet(address),
      getSubdomainForWallet(address as `0x${string}`)
    ])

    if (!developer) {
      // No developer found yet — return empty state
      return NextResponse.json({
        id: null,
        walletAddress: address,
        paymeshSubdomain,
        totalEarnings: '0',
        totalCalls: 0,
        totalApis: 0,
        earningsChart: getLast7Days().map(date => ({ date, earnings: 0 })),
        callsChart: getLast7Days().map(date => ({ date, calls: 0 })),
        apis: [],
        transactions: [],
      })
    }

    const [apis, transactions, totalEarnings] = await Promise.all([
      getApisByDeveloper(developer.id),
      getTransactionsByDeveloper(developer.id),
      getTotalEarnings(developer.id),
    ])

    const days = getLast7Days()

    const earningsChart = days.map(day => ({
      date: day,
      earnings: transactions
        .filter((tx: any) => tx.created_at?.startsWith(day) && tx.verified)
        .reduce((sum: number, tx: any) => sum + parseFloat(tx.amount || '0'), 0),
    }))

    const callsChart = days.map(day => ({
      date: day,
      calls: transactions.filter((tx: any) => tx.created_at?.startsWith(day)).length,
    }))

    const apiStats = apis.map((api: any) => {
      const apiTxs = transactions.filter((tx: any) => tx.api_id === api.id)
      return {
        id: api.id,
        endpoint: api.endpoint,
        price: api.price,
        payTo: api.pay_to,
        enabled: api.enabled,
        totalCalls: apiTxs.length,
        totalEarnings: apiTxs
          .filter((tx: any) => tx.verified)
          .reduce((sum: number, tx: any) => sum + parseFloat(tx.amount || '0'), 0)
          .toFixed(6),
      }
    })

    return NextResponse.json({
      id: developer.id,
      email: developer.email,
      walletAddress: developer.wallet_address,
      ensName: developer.ens_name,
      paymeshSubdomain,
      totalEarnings,
      totalCalls: transactions.length,
      totalApis: apis.length,
      earningsChart,
      callsChart,
      apis: apiStats,
      transactions: transactions.slice(0, 20).map((tx: any) => ({
        txHash: tx.tx_hash,
        amount: tx.amount,
        from: tx.from_address,
        timestamp: tx.created_at,
        timeAgo: timeAgo(tx.created_at),
        status: tx.verified ? 'success' : 'pending',
      })),
    })
  } catch (error) {
    console.error('Developer wallet fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
