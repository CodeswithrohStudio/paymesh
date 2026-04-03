'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createWalletClient, custom } from 'viem'
import { baseSepolia } from 'viem/chains'
import {
  AreaChart, Area, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts'
import { useAccount, useConfig, useSwitchChain, useChainId, useConnectorClient } from 'wagmi'
import { WalletConnect } from '@/components/WalletConnect'
// import { getConnectorClient } from '@wagmi/core' // Removed problematic import
import { 
  Plus, Search, Bell, Layout, Activity, 
  ArrowUpRight, MoreHorizontal, Link as LinkIcon,
  Calendar, Check, Copy, Sparkles, Lightbulb, TrendingUp,
  Plug, Zap, Trash2
} from 'lucide-react'

// ── ABIs & Constants ─────────────────────────────────────────────────────────

const CFA_FORWARDER = '0xcfA132E353cB4E398080B9700609bb008eceB125'
const USDCX_ADDRESS = '0x8430F084B939208E2eDEd1584889C9A66B90562f'
const CFA_FORWARDER_ABI = [{
  name: 'createFlow', type: 'function', stateMutability: 'nonpayable',
  inputs: [
    { name: 'token', type: 'address' }, { name: 'sender', type: 'address' },
    { name: 'receiver', type: 'address' }, { name: 'flowrate', type: 'int96' },
    { name: 'userData', type: 'bytes' },
  ],
  outputs: [{ name: '', type: 'bool' }],
}] as const

interface ApiStat { id: string; endpoint: string; price: string; payTo: string; enabled: boolean; totalCalls: number; totalEarnings: string; category?: string }
interface Transaction { txHash: string; amount: string; from: string; timestamp: string; timeAgo: string; status: string }
interface ChartPoint { date: string; earnings?: number; calls?: number; value?: number }
interface DeveloperData {
  id: string; email: string; walletAddress: string; ensName?: string
  paymeshSubdomain?: string | null
  totalEarnings: string; totalCalls: number; totalApis: number
  earningsChart: ChartPoint[]; callsChart: ChartPoint[]
  apis: ApiStat[]; transactions: Transaction[]
}
interface RegisteredApi { apiId: string; price: string; walletAddress: string; paymeshSubdomain?: string }
interface NewApi { endpoint: string; price: string; category: string; description: string; tags: string; isPublic: boolean; label: string }

// ── Aesthetics Mock Data (Used for placeholders only) ─────────────────────────

const DOTS_DATA_CALLS = Array.from({ length: 15 }).map((_, i) => ({ 
  value: Math.max(10, Math.random() * 100), 
  active: i === 7 
}))
const DOTS_DATA_APIS = Array.from({ length: 15 }).map((_, i) => ({ 
  value: Math.max(10, Math.random() * 80), 
  active: i === 9 
}))

// ── Helper Component ──────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const ok = status === 'success' || status === 'active' || status === 'Active'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
      ok ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      {status}
    </span>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [data, setData] = useState<DeveloperData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [provider, setProvider] = useState<any>(null)
  const [streams, setStreams] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => { setMounted(true) }, [])
  
  const [registeredApi, setRegisteredApi] = useState<RegisteredApi | null>(null)
  const [copied, setCopied] = useState(false)
  const [newApi, setNewApi] = useState<NewApi>({
    endpoint: '', price: '0.001', category: 'Other', 
    description: '', tags: '', isPublic: true, label: ''
  })
  const [registering, setRegistering] = useState(false)
  const [labelStatus, setLabelStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [checkingLabel, setCheckingLabel] = useState(false)

  // Stream state
  const [showStreamModal, setShowStreamModal] = useState(false)
  const [streamReceiver, setStreamReceiver] = useState('')
  const [streamAmount, setStreamAmount] = useState('10')
  const [streamStatus, setStreamStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [streamError, setStreamError] = useState('')
  
  const { address: connectedAddress, isConnected: walletConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const config = useConfig()

  const { data: connectorClient } = useConnectorClient()

  useEffect(() => {
    if (connectorClient) {
      setProvider(connectorClient.transport)
    }
  }, [connectorClient])

  useEffect(() => {
    if (connectedAddress) {
      fetchData(connectedAddress)
      fetchStreams(connectedAddress)
    } else {
      setLoading(false); setProvider(null); setData(null)
    }
  }, [connectedAddress])

  // Poll for subdomain if missing
  useEffect(() => {
    if (connectedAddress && !data?.paymeshSubdomain) {
      const interval = setInterval(() => {
        fetchData(connectedAddress, true)
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [connectedAddress, data?.paymeshSubdomain])

  const fetchData = async (w: string, silent = false) => {
    if (!silent) setLoading(true)
    try { 
      const res = await (await fetch(`/api/developer/wallet/${w}`)).json()
      if (res) setData(res)
    } finally { if (!silent) setLoading(false) }
  }

  const fetchStreams = async (w: string) => {
    try { setStreams((await (await fetch(`/api/stream?wallet=${w}`)).json()).streams || []) }
    catch { setStreams([]) }
  }

  // Check label availability
  useEffect(() => {
    const checkLabel = async () => {
      const label = newApi.label.trim().toLowerCase();
      if (!label || label.length < 3) {
        setLabelStatus('idle');
        return;
      }

      if (!/^[a-z0-9]+$/.test(label)) {
        setLabelStatus('invalid');
        return;
      }

      setLabelStatus('checking');
      try {
        const res = await (await fetch(`/api/subdomain/check?label=${label}`)).json();
        if (res.available) {
          setLabelStatus('available');
        } else {
          setLabelStatus('taken');
        }
      } catch (e) {
        setLabelStatus('idle');
      }
    };

    const timeoutId = setTimeout(checkLabel, 500);
    return () => clearTimeout(timeoutId);
  }, [newApi.label]);

  const handleRegisterApi = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (!connectedAddress) return; setRegistering(true)
    try {
      const json = await (await fetch('/api/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `${connectedAddress.toLowerCase()}@paymesh.dev`, walletAddress: connectedAddress,
          endpoint: newApi.endpoint, price: newApi.price, category: newApi.category,
          description: newApi.description, tags: newApi.tags.split(',').map(t => t.trim()).filter(Boolean),
          isPublic: newApi.isPublic,
          paymeshLabel: newApi.label
        }),
      })).json()
      if (json.success) { 
        setRegisteredApi({ apiId: json.apiId, price: newApi.price, walletAddress: connectedAddress, paymeshSubdomain: json.paymeshSubdomain })
        fetchData(connectedAddress)
      }
    } finally { setRegistering(false) }
  }
  
  const startStream = async () => {
    if (!connectedAddress || !provider || !streamReceiver || !streamAmount) return

    if (chainId !== baseSepolia.id) {
      try { switchChain({ chainId: baseSepolia.id }); return; } catch (e) { return; }
    }

    setStreamStatus('loading'); setStreamError('')
    try {
      const { flowRate } = await (await fetch('/api/stream', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: connectedAddress, receiver: streamReceiver, usdcPerMonth: streamAmount }),
      })).json()
      const wc = createWalletClient({ chain: baseSepolia, transport: custom(provider) })
      await wc.writeContract({
        address: CFA_FORWARDER, abi: CFA_FORWARDER_ABI, functionName: 'createFlow',
        args: [USDCX_ADDRESS, connectedAddress as `0x${string}`, streamReceiver as `0x${string}`, BigInt(flowRate), '0x'],
        account: connectedAddress as `0x${string}`,
      })
      setStreamStatus('success')
      setTimeout(() => { setShowStreamModal(false); setStreamStatus('idle'); fetchStreams(connectedAddress) }, 2000)
    } catch (err) { setStreamError((err as any)?.message || 'Failed'); setStreamStatus('error') }
  }

  const copySnippet = () => {
    if (!registeredApi) return
    const snippet = `import { paymeshNext } from 'paymesh-x402';\nimport { NextResponse } from 'next/server';\n\nexport async function GET(request: Request) {\n  const check = await paymeshNext(request, { price: '${registeredApi.price}', payTo: '${registeredApi.walletAddress}', enabled: true });\n  if (check) return check;\n  const url = new URL(request.url);\n  url.searchParams.delete('x_payment'); url.searchParams.delete('X-Payment');\n  return NextResponse.json({ data: 'Secure' });\n}`
    navigator.clipboard.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const handleDeleteApi = async (id: string) => {
    if (!confirm('Are you sure you want to delete this endpoint?')) return
    try {
      const res = await fetch(`/api/register/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData(connectedAddress!)
    } catch (e) { console.error('Delete failed:', e) }
  }

  // Derived Values
  let totalEarningsStr = "$0.00"
  let totalCallsStr = "0"
  let totalApisStr = "0"
  
  if (data?.totalEarnings) totalEarningsStr = `$${Number(data.totalEarnings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (data?.totalCalls) totalCallsStr = data.totalCalls > 1000 ? `${(data.totalCalls / 1000).toFixed(1)}k` : data.totalCalls.toString()
  if (data?.totalApis) totalApisStr = data.totalApis.toString()
  
  // Calculate specific segment earnings for standard visual bars
  const getCategoryEarnings = (): [string, number][] => {
    if (!data || !data.apis || data.apis.length === 0) return [['AI', 0], ['Data', 0], ['Other', 0]]
    const Map: Record<string, number> = {}
    data.apis.forEach(api => {
      const cat = api.category || 'Other'
      Map[cat] = (Map[cat] || 0) + parseFloat(api.totalEarnings)
    })
    return Object.entries(Map).sort((a,b) => b[1] - a[1])
  }
  const catEarnings = getCategoryEarnings()
  const totalNum: number = parseFloat(data?.totalEarnings || '0')

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'endpoints', label: 'Endpoints' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'streams', label: 'Streams' },
    { id: 'inbox', label: 'Inbox' },
    { id: 'connect', label: 'Deploy API' }
  ]

  // XMTP Inbox Logic
  const [xmtpMessages, setXmtpMessages] = useState<any[]>([])
  const [xmtpStatus, setXmtpStatus] = useState<'idle' | 'loading' | 'ready'>('idle')
  
  const loadXmtp = async () => {
    if (!connectedAddress) return;
    setXmtpStatus('loading');
    try {
      const { initXmtp } = await import('@/lib/xmtp');
      const client = await initXmtp(connectedAddress);
      
      const convos = await client.conversations.list();
      let allMessages: any[] = [];
      for (const convo of convos) {
        const msgs = await convo.messages();
        allMessages.push(...msgs.map(m => ({
          id: m.id,
          sender: m.senderAddress,
          content: m.content,
          sentAt: m.sent.toLocaleString()
        })));
      }
      // Sort newest first
      allMessages.sort((a,b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
      setXmtpMessages(allMessages);
      setXmtpStatus('ready');
    } catch (e) {
      console.error(e);
      setXmtpStatus('idle');
    }
  }

  return (
    <div className="min-h-screen bg-[#f1f2f5] font-sans pb-12 selection:bg-blue-200 selection:text-blue-900">
      {/* ── Top Navigation ── */}
      <div className="pt-6 px-12 pb-6 max-w-[1700px] mx-auto flex items-center justify-between z-40 relative animate-fade-up">
        <div className="flex items-center gap-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="grid grid-cols-2 gap-[2px] w-6 h-6">
              <div className="w-full h-full bg-blue-600 rounded-[2px]"></div>
              <div className="w-full h-full bg-blue-400 rounded-[2px] opacity-80"></div>
              <div className="w-full h-full bg-gray-900 rounded-[2px]"></div>
              <div className="w-full h-full bg-gray-900 rounded-[2px]"></div>
            </div>
            <span className="font-bold text-gray-900 text-[22px] tracking-tight">PayMesh</span>
          </Link>

          {/* Nav Pills */}
          <div className="flex items-center gap-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`px-[18px] py-2 rounded-[24px] text-[14px] font-semibold transition-all ${
                  activeTab === t.id 
                    ? 'bg-[#1e1e1e] text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          <Link href="/marketplace" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">Marketplace</Link>
          <div className="flex items-center gap-3">
             {!mounted ? (
               <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 animate-pulse"></div>
             ) : walletConnected ? (
               <>
                 <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-[2px] border-white shadow-sm overflow-hidden flex items-center justify-center">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${connectedAddress}`} alt="avatar" />
                 </div>
                 {(data?.paymeshSubdomain || registeredApi?.paymeshSubdomain) ? (
                   <div className="flex flex-col items-end">
                     <span className="text-[12px] font-bold text-gray-900 leading-tight">Your PayMesh ID</span>
                     <span className="text-[11px] font-mono font-bold text-blue-600 leading-tight">
                       {data?.paymeshSubdomain || registeredApi?.paymeshSubdomain}
                     </span>
                   </div>
                 ) : (
                   <div className="flex flex-col items-end opacity-40">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">PayMesh ID</span>
                     <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                       <span className="text-[10px] font-medium text-gray-500 italic">Searching...</span>
                     </div>
                   </div>
                 )}
               </>
             ) : (
               <div className="scale-90">
                 <WalletConnect />
               </div>
             )}
          </div>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto px-12 mt-2">

        {!mounted ? (
          <div className="mt-32 flex flex-col items-center justify-center animate-pulse">
            <div className="w-20 h-20 bg-gray-100 rounded-full mb-6"></div>
            <div className="h-4 w-48 bg-gray-100 rounded mb-3"></div>
            <div className="h-3 w-64 bg-gray-100 rounded"></div>
          </div>
        ) : !walletConnected ? (
          <div className="mt-32 text-center max-w-lg mx-auto bg-white rounded-[32px] p-16 shadow-sm border border-black/5 animate-fade-up">
            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plug size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Wallet Connection Required</h2>
            <p className="text-[14px] text-gray-500 mb-10 leading-relaxed font-medium">To access your dashboard, connect your wallet to view real-time API monetization data.</p>
            <div className="flex justify-center scale-110">
              <WalletConnect />
            </div>
          </div>
        ) : (
          <>
            {/* ── 1. Overview Tab (Mimicking Zentra Layout with PayMesh Data) ── */}
            {activeTab === 'overview' && (
              <div className="animate-fade-up space-y-8">
                
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h1 className="text-[44px] leading-none font-medium text-gray-900 tracking-[-1px]">Developer Home</h1>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => setActiveTab('connect')} className="h-[42px] px-5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl text-[13px] font-semibold text-gray-700 transition-colors">
                      + Deploy Endpoint
                    </button>
                    <button onClick={() => setShowStreamModal(true)} className="h-[42px] px-5 flex items-center justify-center gap-2 bg-[#1e1e1e] hover:bg-black rounded-xl text-[13px] font-semibold text-white transition-colors">
                      <Zap size={14} className="fill-current text-yellow-400" /> Start Stream
                    </button>
                  </div>
                </div>

                {/* Grid Container */}
                <div className="flex flex-col gap-6">
                  
                  {/* Row 1 */}
                  <div className="grid grid-cols-1 lg:grid-cols-[63%_35%] gap-6 xl:gap-8">
                    
                    {/* Performance Chart Card */}
                    <div className="bg-white rounded-[32px] p-8 pb-5 flex flex-col relative shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-black/[0.03] min-h-[420px]">
                      <div className="flex justify-between items-start mb-6">
                        <h2 className="text-[17px] font-bold text-gray-900 tracking-tight">API Performance Over Time</h2>
                        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-800 transition-colors"><MoreHorizontal size={14} /></button>
                      </div>

                      {/* Header values for chart */}
                      <div className="flex justify-between items-end mb-8 relative z-10 px-2 lg:px-4">
                        <div className="flex flex-col opacity-50">
                            <span className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Avg Price</span>
                            <span className="text-[22px] font-light text-gray-400 tracking-tight">{data?.totalCalls ? (parseFloat(data?.totalEarnings || '0') / data.totalCalls).toFixed(4) : "0.00"} USDC</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Total Calls</span>
                            <span className="text-[22px] font-light tracking-tight text-gray-900 font-bold">{data?.totalCalls?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex flex-col opacity-50">
                            <span className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Success Rate</span>
                            <span className="text-[22px] font-light text-gray-400 tracking-tight">99.9%</span>
                        </div>
                      </div>

                      {/* Data Chart exactly replicating blue stepped bars effect */}
                      <div className="flex-1 w-full h-[220px] -mt-4 relative">
                        <ResponsiveContainer width="100%" height="100%">
                           <ComposedChart data={data?.earningsChart || []} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                              <pattern id="diagonalStripes" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                                <rect width="8" height="8" fill="#e0e7ff" />
                                <line x1="0" y1="0" x2="0" y2="8" stroke="#6366f1" strokeWidth="2" opacity="0.6" />
                              </pattern>
                              <linearGradient id="solidBlue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2563eb" />
                                <stop offset="100%" stopColor="#3b82f6" />
                              </linearGradient>
                            </defs>
                            <Tooltip cursor={{fill: 'rgba(59,130,246,0.05)'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                            <Bar dataKey="earnings" fill="url(#solidBlue)" radius={[4, 4, 0, 0]} maxBarSize={60}>
                              {data?.earningsChart?.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === data.earningsChart.length - 1 ? "url(#solidBlue)" : "url(#diagonalStripes)"} opacity={index === data.earningsChart.length - 1 ? 1 : 0.8} />
                              ))}
                            </Bar>
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Total Earnings Card */}
                    <div className="bg-white rounded-[32px] p-8 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-black/[0.03]">
                      <div className="flex justify-between items-start mb-6">
                        <h2 className="text-[17px] font-bold text-gray-900 tracking-tight">Total Volume</h2>
                        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-800 transition-colors"><MoreHorizontal size={14} /></button>
                      </div>

                      <div className="flex items-center gap-4 mb-10">
                        <h1 className="text-[52px] font-medium text-gray-900 tracking-[-2px] leading-none">{totalEarningsStr}</h1>
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[12px] font-bold border border-emerald-100/50">
                          <ArrowUpRight size={12} strokeWidth={3} />
                          Active
                        </span>
                      </div>

                      <div className="space-y-6">
                         {catEarnings.slice(0, 3).map(([cat, amount]: [string, number], idx) => {
                           const pct = totalNum > 0 ? (amount / totalNum) * 100 : 0;
                           const colorTheme = idx === 0 
                             ? 'repeating-linear-gradient(45deg, #10b981, #10b981 4px, #34d399 4px, #34d399 8px)'
                             : idx === 1 
                               ? 'repeating-linear-gradient(45deg, #3b82f6, #3b82f6 4px, #60a5fa 4px, #60a5fa 8px)'
                               : 'repeating-linear-gradient(45deg, #f43f5e, #f43f5e 4px, #fb7185 4px, #fb7185 8px)'
                               
                           return (
                             <div key={idx}>
                                <div className="flex justify-between text-[13px] font-bold text-gray-500 mb-2">
                                  <span>{cat} APIs</span>
                                  <span className="text-gray-900">${amount.toLocaleString()}</span>
                                </div>
                                <div className="h-[8px] max-w-full bg-gray-100 rounded-full overflow-hidden w-[85%]">
                                  <div className="h-full rounded-full relative" style={{width: pct + '%', background: colorTheme}}></div>
                                </div>
                             </div>
                           )
                         })}
                      </div>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
                    
                    {/* Recent Sales / Transactions List */}
                    <div className="bg-white rounded-[32px] p-6 pb-4 flex flex-col shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-black/[0.03] min-h-[300px] overflow-hidden">
                      <div className="flex justify-between items-start mb-4">
                        <h2 className="text-[17px] font-bold text-gray-900 tracking-tight">Recent Sales</h2>
                        <button onClick={() => setActiveTab('transactions')} className="text-[11px] font-bold text-blue-500 hover:text-blue-700">VIEW ALL</button>
                      </div>
                      <div className="flex-1 w-full mt-2 overflow-y-auto scroller-hide space-y-3">
                        {data?.transactions?.slice(0, 4).map((tx, idx) => (
                           <div key={idx} className="flex justify-between items-center group cursor-default p-2 hover:bg-gray-50 rounded-xl transition-colors">
                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 font-bold flex items-center justify-center text-xs">✓</div>
                               <div>
                                 <p className="text-[13px] font-bold text-gray-900">+{tx.amount} USDC</p>
                                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{tx.timeAgo}</p>
                               </div>
                             </div>
                           </div>
                        ))}
                        {!data?.transactions?.length && (
                          <div className="h-full flex items-center justify-center text-[12px] font-bold text-gray-400">No sales yet.</div>
                        )}
                      </div>
                    </div>

                    {/* API Calls Mini Chart */}
                    <div className="bg-white rounded-[32px] p-6 pb-8 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-black/[0.03] min-h-[300px]">
                      <div className="flex justify-between items-start mb-4">
                        <h2 className="text-[17px] font-bold text-gray-900 tracking-tight">Calls / Min</h2>
                      </div>
                      <div className="flex items-center justify-between">
                         <h1 className="text-[40px] font-medium text-gray-900 tracking-[-1.5px]">{totalCallsStr}</h1>
                         <div className="text-right">
                           <p className="text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-wide">Trend</p>
                           <p className="text-[14px] font-bold text-emerald-500"><TrendingUp size={16}/></p>
                         </div>
                      </div>
                      <div className="flex-1 mt-6 relative w-full flex items-end justify-center px-4">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] px-3 py-1 rounded-full text-[10px] font-bold text-gray-600 block z-10 w-max whitespace-nowrap">
                          Peak Period
                        </div>
                        <div className="flex items-end justify-center gap-[3px] h-20 overflow-hidden w-full px-[5%]">
                          {DOTS_DATA_CALLS.map((col, i) => (
                             <div key={i} className="flex flex-col gap-[3px] justify-end pb-2">
                               {Array.from({ length: Math.ceil(col.value / 15) }).map((_, j) => (
                                 <div key={j} className={`w-[6px] h-[6px] rounded-full ${col.active ? 'bg-emerald-500' : 'bg-emerald-500/30'}`}></div>
                               ))}
                             </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Endpoints Count Chart */}
                    <div className="bg-white rounded-[32px] p-6 pb-8 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-black/[0.03] min-h-[300px]">
                      <div className="flex justify-between items-start mb-4">
                        <h2 className="text-[17px] font-bold text-gray-900 tracking-tight">Endpoints</h2>
                      </div>
                      <div className="flex items-center justify-between">
                         <h1 className="text-[40px] font-medium text-gray-900 tracking-[-1.5px]">{totalApisStr}</h1>
                         <div className="text-right">
                           <p className="text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-wide">Status</p>
                           <p className="text-[14px] font-bold text-gray-900">Deployed</p>
                         </div>
                      </div>
                      <div className="flex-1 mt-6 relative w-full flex items-end justify-center px-4">
                        <div className="flex items-end justify-center gap-[3px] h-20 overflow-hidden w-full px-[5%]">
                          {DOTS_DATA_APIS.map((col, i) => (
                             <div key={i} className="flex flex-col gap-[3px] justify-end pb-2">
                               {Array.from({ length: Math.ceil(col.value / 15) }).map((_, j) => (
                                 <div key={j} className={`w-[6px] h-[6px] rounded-full ${col.active ? 'bg-blue-600' : 'bg-blue-200'}`}></div>
                               ))}
                             </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Insights / Connection Status */}
                    <div className="rounded-[32px] p-8 shadow-[0_12px_40px_rgba(0,0,0,0.08)] relative overflow-hidden flex flex-col justify-between min-h-[300px] text-white" style={{ background: 'radial-gradient(130% 130% at 80% 0%, #3b82f6 0%, #1d4ed8 40%, #1e3a8a 80%, #0f172a 100%)' }}>
                       <div className="absolute top-10 right-[-30px] w-64 h-64 border-[30px] border-white/10 rounded-[40px] rotate-45 pointer-events-none filter blur-sm"></div>
                       <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

                       <div className="relative z-10">
                         <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-bold mb-6 border border-white/20">
                           <Lightbulb size={12} /> Status
                         </div>
                         <h1 className="text-[48px] font-light leading-none tracking-[-2px] mb-4">Healthy</h1>
                         <p className="text-[15px] font-semibold leading-snug mb-2">Connected to Base Sepolia L2.</p>
                         <p className="text-[12px] opacity-80 leading-relaxed font-medium">Your API routes are completely secured by the x402 protocol and ready for monetization.</p>
                       </div>
                       
                       <div className="mt-6 relative z-10 w-full pt-4 border-t border-white/20">
                         <button onClick={() => setActiveTab('connect')} className="text-[14px] font-bold w-full text-left hover:text-blue-200 transition-colors">
                           Configure Settings →
                         </button>
                       </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* ── 2. Endpoints Tab ── */}
            {activeTab === 'endpoints' && (
              <div className="animate-fade-up max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Active Endpoints</h1>
                  <button onClick={() => setActiveTab('connect')} className="bg-[#1e1e1e] hover:bg-black text-white px-5 py-2.5 rounded-xl text-[14px] font-bold shadow-md transition-colors">Deploy New</button>
                </div>
                <div className="bg-white rounded-[32px] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-black/[0.03]">
                   {!data?.apis?.length ? (
                     <div className="py-20 text-center text-gray-400 font-bold">No endpoints actively listed.</div>
                   ) : (
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Endpoint URL</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Calls</th>
                             <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Earnings</th>
                             <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                             <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right text-transparent">Action</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                         {data.apis.map(api => (
                           <tr key={api.id} className="hover:bg-gray-50/50 transition-colors">
                             <td className="px-6 py-5 font-mono text-[13px] text-gray-800">{api.endpoint}</td>
                             <td className="px-6 py-5 text-[14px] font-semibold text-gray-600">{api.category || 'Other'}</td>
                             <td className="px-6 py-5 text-[14px] font-bold text-gray-900">{api.price} <span className="text-xs font-medium text-gray-400">USDC</span></td>
                             <td className="px-6 py-5 text-[14px] font-semibold text-gray-600">{api.totalCalls.toLocaleString()}</td>
                              <td className="px-6 py-5 text-[14px] font-bold text-blue-600">${api.totalEarnings}</td>
                              <td className="px-6 py-5"><StatusBadge status={api.enabled ? 'Active' : 'Offline'} /></td>
                              <td className="px-6 py-5 text-right">
                                <button onClick={() => handleDeleteApi(api.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                         ))}
                       </tbody>
                     </table>
                   )}
                </div>
              </div>
            )}

            {/* ── 3. Transactions Tab ── */}
            {activeTab === 'transactions' && (
              <div className="animate-fade-up max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Ledger</h1>
                </div>
                <div className="bg-white rounded-[32px] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-black/[0.03]">
                   {!data?.transactions?.length ? (
                     <div className="py-20 text-center text-gray-400 font-bold">No transactions found.</div>
                   ) : (
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Hash</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Value</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sender</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Status</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                         {data.transactions.map(tx => (
                           <tr key={tx.txHash} className="hover:bg-gray-50/50 transition-colors">
                             <td className="px-6 py-5 font-mono text-[13px] text-blue-600 hover:text-blue-800">
                               <a href={`https://sepolia.basescan.org/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer">{tx.txHash.slice(0, 16)}...</a>
                             </td>
                             <td className="px-6 py-5 text-[14px] font-bold text-emerald-600">+{tx.amount} USDC</td>
                             <td className="px-6 py-5 font-mono text-[13px] bg-gray-50 rounded text-gray-600">{tx.from.slice(0, 8)}...{tx.from.slice(-4)}</td>
                             <td className="px-6 py-5 text-[14px] font-semibold text-gray-500">{tx.timeAgo}</td>
                             <td className="px-6 py-5 text-right"><StatusBadge status={tx.status} /></td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   )}
                </div>
              </div>
            )}

            {/* ── 4. Streams Tab ── */}
            {activeTab === 'streams' && (
              <div className="animate-fade-up max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Superfluid Streams</h1>
                    <p className="text-[14px] text-gray-500 font-medium">Continuous real-time settlement for long-running workloads.</p>
                  </div>
                  <button onClick={() => setShowStreamModal(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[14px] font-bold shadow-md transition-colors flex items-center gap-2">
                    <Zap size={16} className="fill-current text-white" /> Start Stream
                  </button>
                </div>
                <div className="bg-white rounded-[32px] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-black/[0.03]">
                   {!streams?.length ? (
                     <div className="py-20 text-center text-gray-400 font-bold">No active streams found.</div>
                   ) : (
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Receiver</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Raw Rate</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Monthly Speed</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Status</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                         {streams.map(s => (
                           <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                             <td className="px-6 py-5 font-mono text-[13px] text-gray-800">{s.receiver.slice(0, 10)}...{s.receiver.slice(-4)}</td>
                             <td className="px-6 py-5 text-[14px] font-semibold text-gray-500">{s.flowRate} wei/s</td>
                             <td className="px-6 py-5 text-[14px] font-bold text-blue-600">{s.monthlyAmount} USDCx/mo</td>
                             <td className="px-6 py-5 text-right"><StatusBadge status="Active" /></td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   )}
                </div>
              </div>
            )}

            {/* ── 5. XMTP Inbox Tab ── */}
            {activeTab === 'inbox' && (
              <div className="animate-fade-up max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">XMTP Inbox</h1>
                    <p className="text-[14px] text-gray-500 font-medium">Real-time wallet-to-wallet purchase notifications.</p>
                  </div>
                  <button onClick={loadXmtp} className="bg-[#7d00f5] hover:bg-[#6b00d6] text-white px-5 py-2.5 rounded-xl text-[14px] font-bold shadow-md transition-colors flex items-center gap-2">
                    {xmtpStatus === 'loading' ? 'Syncing Network...' : 'Load XMTP Network'}
                  </button>
                </div>
                <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-black/[0.03] min-h-[400px]">
                   {xmtpStatus === 'idle' ? (
                     <div className="py-20 text-center text-gray-400 font-bold flex flex-col items-center">
                       <div className="w-16 h-16 bg-[#7d00f5]/10 flex items-center justify-center rounded-full mb-4">
                         <Bell className="text-[#7d00f5]" size={24} />
                       </div>
                       Click "Load" to sign via Web3 and decrypt your messages.
                     </div>
                   ) : xmtpStatus === 'loading' ? (
                     <div className="py-20 text-center text-[#7d00f5] font-bold animate-pulse">Waiting for signature & decrypting...</div>
                   ) : !xmtpMessages.length ? (
                     <div className="py-20 text-center text-gray-400 font-bold">Inbox is empty.</div>
                   ) : (
                     <div className="space-y-4">
                        {xmtpMessages.map(msg => (
                           <div key={msg.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex gap-4">
                             <div className="w-10 h-10 bg-[#7d00f5]/10 rounded-full flex items-center justify-center shrink-0">
                               <Bell className="text-[#7d00f5]" size={16} />
                             </div>
                             <div>
                               <div className="flex items-center gap-2 mb-1">
                                 <span className="font-mono text-[11px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded">FROM: {msg.sender.slice(0,6)}...</span>
                                 <span className="text-[11px] text-gray-400 font-bold">{msg.sentAt}</span>
                               </div>
                               <p className="text-[14px] font-bold text-gray-900">{String(msg.content)}</p>
                             </div>
                           </div>
                        ))}
                     </div>
                   )}
                </div>
              </div>
            )}

            {/* ── 6. Connect/Deploy Tab ── */}
            {activeTab === 'connect' && (
              <div className="animate-fade-up max-w-2xl mx-auto mt-8">
                <div className="bg-white rounded-[32px] p-10 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-black/[0.03]">
                  <h2 className="text-[28px] font-medium text-gray-900 tracking-tight mb-2">Deploy Endpoint</h2>
                  <p className="text-[14px] font-medium text-gray-500 mb-8">Register your API via the x402 protocol and get your integration snippet instantly.</p>
                  
                  <form onSubmit={handleRegisterApi} className="space-y-6">
                    <div>
                      <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-2">Endpoint URL</label>
                      <input type="url" value={newApi.endpoint} onChange={(e) => setNewApi({ ...newApi, endpoint: e.target.value })}
                        className="w-full px-5 py-4 bg-[#f8fafc] border border-gray-200/60 rounded-2xl text-[14px] font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]"
                        placeholder="https://api.example.com/data" required />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-2">Choose your PayMesh ID</label>
                      <div className="relative">
                        <input type="text" value={newApi.label} onChange={(e) => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                          setNewApi({ ...newApi, label: val });
                        }}
                          className={`w-full pl-5 pr-32 py-4 bg-[#f8fafc] border rounded-2xl text-[14px] font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)] ${
                            labelStatus === 'available' ? 'border-emerald-200' : 
                            labelStatus === 'taken' || labelStatus === 'invalid' ? 'border-rose-200' : 
                            'border-gray-200/60'
                          }`}
                          placeholder="e.g. rahul" required minLength={3} />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-blue-600/50">
                          .paymesh.eth
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-[11px] font-medium">
                          {labelStatus === 'checking' && <span className="text-blue-500 animate-pulse">Checking availability...</span>}
                          {labelStatus === 'available' && <span className="text-emerald-500 flex items-center gap-1">✅ Available!</span>}
                          {labelStatus === 'taken' && <span className="text-rose-500 flex items-center gap-1">❌ Taken</span>}
                          {labelStatus === 'invalid' && <span className="text-rose-400">Min 3 characters, lowercase letters & numbers only</span>}
                          {labelStatus === 'idle' && <span className="text-gray-400">Your unique on-chain identity on Ethereum Sepolia.</span>}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-2">Price per call (USDC)</label>
                        <input type="number" step="0.0001" value={newApi.price} onChange={(e) => setNewApi({ ...newApi, price: e.target.value })}
                          className="w-full px-5 py-4 bg-[#f8fafc] border border-gray-200/60 rounded-2xl text-[14px] font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]" required />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-2">Classification</label>
                        <select value={newApi.category} onChange={(e) => setNewApi({ ...newApi, category: e.target.value })}
                          className="w-full px-5 py-4 bg-[#f8fafc] border border-gray-200/60 rounded-2xl text-[14px] font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]">
                          {['Weather', 'Finance', 'AI', 'Data', 'Sports', 'Other'].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="pt-4">
                      <button type="submit" disabled={registering}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl text-[15px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
                        {registering ? 'Deploying to network...' : 'Register Endpoint'}
                      </button>
                    </div>
                  </form>

                  {registeredApi && (
                    <div className="mt-8 p-6 bg-emerald-50 border border-emerald-100 rounded-3xl animate-fade-up">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-[13px] mb-4">
                        <Check size={16} /> API Successfully Registered
                      </div>
                      {registeredApi.paymeshSubdomain ? (
                        <div className="flex items-center gap-2 text-blue-600 font-bold text-[12px] mb-4 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                          <Sparkles size={14} /> PayMesh ID Reserved: {registeredApi.paymeshSubdomain}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-500 font-medium text-[11px] mb-4 bg-gray-50 p-2 rounded-lg border border-gray-100">
                          <Sparkles size={14} /> Configuring PayMesh ID on Ethereum Sepolia...
                        </div>
                      )}
                      <div className="bg-[#1e1e1e] rounded-2xl p-5 relative font-mono text-[12px] leading-relaxed text-emerald-400 overflow-x-auto shadow-inner">
                        <pre>
{`import { paymeshNext } from 'paymesh-x402';

export async function GET(request: Request) {
  // Verifies USDC payment via x402 headers
  const check = await paymeshNext(request, { 
    price: '${registeredApi.price}', 
    payTo: '${registeredApi.walletAddress}', 
    enabled: true 
  });
  if (check) return check;
  
  // Custom API logic here
  return Response.json({ status: "Success" });
}`}
                        </pre>
                        <button onClick={copySnippet} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-all">
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </>
        )}
      </div>

      {/* ── Stream Modal ── */}
      {showStreamModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full animate-fade-up shadow-2xl border border-gray-100">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-[22px] font-bold text-gray-900 tracking-tight">Initiate Flow</h3>
                <button onClick={() => setShowStreamModal(false)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 font-bold flex items-center justify-center transition-colors">✕</button>
             </div>
             <div className="space-y-6">
               <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2">Receiver Address</label>
                  <input type="text" value={streamReceiver} onChange={(e) => setStreamReceiver(e.target.value)}
                         className="w-full px-5 py-4 bg-[#f8fafc] border border-gray-200/60 rounded-2xl text-[14px] font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" placeholder="0x..." />
               </div>
               <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2">USDCx Per Month</label>
                  <input type="number" value={streamAmount} onChange={(e) => setStreamAmount(e.target.value)}
                         className="w-full px-5 py-4 bg-[#f8fafc] border border-gray-200/60 rounded-2xl text-[18px] font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
               </div>
               {streamStatus === 'error' && <p className="text-[13px] font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">{streamError}</p>}
               {streamStatus === 'success' && <p className="text-[13px] font-bold text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100">Flow successfully created!</p>}
               
               <button onClick={startStream} disabled={streamStatus === 'loading'} className="w-full bg-[#1e1e1e] hover:bg-black text-white font-bold tracking-wide text-[15px] py-4 rounded-2xl shadow-lg transition-all disabled:opacity-50">
                  {streamStatus === 'loading' ? 'Broadcasting Tx...' : 'Execute Transaction'}
               </button>
             </div>
          </div>
        </div>
      )}

    </div>
  )
}
