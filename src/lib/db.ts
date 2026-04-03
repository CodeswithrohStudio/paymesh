import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// ── Developers ──────────────────────────────────────────────────────────────

export async function getDeveloperByWallet(walletAddress: string) {
  const { data } = await supabase
    .from('developers')
    .select('*')
    .ilike('wallet_address', walletAddress)
    .single()
  return data
}

export async function getDeveloperByEmail(email: string) {
  const { data } = await supabase
    .from('developers')
    .select('*')
    .eq('email', email)
    .single()
  return data
}

export async function getDeveloperById(id: string) {
  const { data } = await supabase
    .from('developers')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function createDeveloper(params: {
  email: string
  wallet_address: string
  ens_name?: string
}) {
  const { data, error } = await supabase
    .from('developers')
    .insert(params)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── APIs ─────────────────────────────────────────────────────────────────────

export async function createApi(params: {
  developer_id: string
  endpoint: string
  price: string
  pay_to: string
  category?: string
  description?: string
  tags?: string[]
  is_public?: boolean
  enabled?: boolean
}) {
  const { data, error } = await supabase
    .from('apis')
    .insert({ ...params, enabled: params.enabled ?? true })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getApisByDeveloper(developerId: string) {
  const { data } = await supabase
    .from('apis')
    .select('*')
    .eq('developer_id', developerId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function deleteApi(id: string) {
  const { error } = await supabase
    .from('apis')
    .delete()
    .eq('id', id)
  if (error) throw error
  return true
}

export async function getApiById(id: string) {
  const { data } = await supabase
    .from('apis')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function getApiByEndpoint(endpoint: string) {
  const { data } = await supabase
    .from('apis')
    .select('*')
    .eq('endpoint', endpoint)
    .single()
  return data
}

// ── Transactions ─────────────────────────────────────────────────────────────

export async function createTransaction(params: {
  api_id: string
  tx_hash: string
  amount: string
  from_address: string
  to_address: string
  verified?: boolean
}) {
  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...params, verified: params.verified ?? false })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getTransactionsByDeveloper(developerId: string) {
  const { data } = await supabase
    .from('transactions')
    .select('*, apis!inner(developer_id)')
    .eq('apis.developer_id', developerId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getTransactionByHash(txHash: string) {
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('tx_hash', txHash)
    .single()
  return data
}

export async function getTotalEarnings(developerId: string): Promise<string> {
  const { data } = await supabase
    .from('transactions')
    .select('amount, apis!inner(developer_id)')
    .eq('apis.developer_id', developerId)
    .eq('verified', true)
  if (!data || data.length === 0) return '0'
  const total = data.reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
  return total.toFixed(6)
}

// ── Marketplace ───────────────────────────────────────────────────────────────

export async function getPublicApis(params?: {
  query?: string
  category?: string
  maxPrice?: number
  sortBy?: 'price_asc' | 'popular'
}) {
  let q = supabase
    .from('apis')
    .select('*, developers(wallet_address, ens_name)')
    .eq('is_public', true)
    .eq('enabled', true)

  if (params?.category && params.category !== 'All') {
    q = q.eq('category', params.category)
  }
  if (params?.maxPrice) {
    q = q.lte('price', params.maxPrice.toString())
  }
  if (params?.query) {
    q = q.or(`description.ilike.%${params.query}%,category.ilike.%${params.query}%,endpoint.ilike.%${params.query}%`)
  }
  if (params?.sortBy === 'popular') {
    q = q.order('total_calls', { ascending: false })
  } else {
    q = q.order('price', { ascending: true })
  }

  const { data } = await q
  return data ?? []
}

export async function incrementApiCalls(apiId: string) {
  await supabase.rpc('increment_api_calls', { api_id: apiId })
}
