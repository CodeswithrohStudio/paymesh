import { NextRequest, NextResponse } from 'next/server'
import { getDeveloperById, getApisByDeveloper, getTransactionsByDeveloper, getTotalEarnings } from '@/lib/db'

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const developer = await getDeveloperById(id)
    if (!developer) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
    }

    const [apis, transactions, totalEarnings] = await Promise.all([
      getApisByDeveloper(id),
      getTransactionsByDeveloper(id),
      getTotalEarnings(id),
    ])

    const days = getLast7Days()

    // Earnings per day (last 7 days)
    const earningsChart = days.map(day => ({
      date: day,
      earnings: transactions
        .filter((tx: any) => tx.created_at?.startsWith(day) && tx.verified)
        .reduce((sum: number, tx: any) => sum + parseFloat(tx.amount || '0'), 0),
    }))

    // Calls per day (last 7 days)
    const callsChart = days.map(day => ({
      date: day,
      calls: transactions.filter((tx: any) => tx.created_at?.startsWith(day)).length,
    }))

    // Per-API stats
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
    console.error('Developer fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
