'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { CloudSun, LineChart, Bot, Database, Trophy, Newspaper, Plug, LayoutGrid, Search } from 'lucide-react'

const CATEGORIES = ['All', 'Weather', 'Finance', 'AI', 'Data', 'Sports', 'News', 'Other']
const CAT_ICONS: Record<string, React.ReactNode> = {
  Weather: <CloudSun size={18} />, Finance: <LineChart size={18} />, AI: <Bot size={18} />, Data: <Database size={18} />,
  Sports: <Trophy size={18} />, News: <Newspaper size={18} />, Other: <Plug size={18} />, All: <LayoutGrid size={18} />,
}

interface ApiListing {
  id: string; endpointMasked: string; endpoint: string; price: string
  category: string; description: string; tags: string[]
  totalCalls: number; reliabilityScore: number
  developerWallet: string; developerEns: string | null; payTo: string
  paymeshSubdomain: string | null
}

export default function Marketplace() {
  const [results, setResults] = useState<ApiListing[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState<'price_asc' | 'popular'>('popular')
  const [tryApi, setTryApi] = useState<ApiListing | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const search = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (query) p.set('query', query)
      if (category !== 'All') p.set('category', category)
      if (maxPrice) p.set('maxPrice', maxPrice)
      p.set('sortBy', sortBy)
      const res = await fetch(`/api/marketplace/search?${p}`)
      setResults((await res.json()).results || [])
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [query, category, maxPrice, sortBy])

  useEffect(() => { search() }, [category, sortBy, search])

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] text-gray-900 font-sans">
      
      {/* Dynamic Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-60" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

      {/* Nav */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="grid grid-cols-2 gap-[2px] w-6 h-6">
              <div className="w-full h-full bg-blue-600 rounded-[2px]"></div>
              <div className="w-full h-full bg-blue-400 rounded-[2px] opacity-80"></div>
              <div className="w-full h-full bg-gray-900 rounded-[2px]"></div>
              <div className="w-full h-full bg-gray-900 rounded-[2px]"></div>
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">PayMesh</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-semibold text-gray-500 hidden sm:block uppercase tracking-wider mr-4">Marketplace</span>
            <Link href="/dashboard" className="text-[14px] font-bold bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 px-5 py-2.5 rounded-xl transition-all shadow-sm">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative pt-36 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200/50 shadow-sm rounded-full px-4 py-1.5 text-xs font-semibold text-gray-600 mb-6 uppercase tracking-wider">
            <span className="w-2 h-2 bg-emerald-500 rounded-full pulse-dot" />
            Live Marketplace
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-4 tracking-tight text-gray-900">
            The App Store for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">AI Agents</span>
          </h1>
          <p className="text-gray-500 text-lg sm:text-xl mb-10 max-w-2xl mx-auto font-medium">
            Discover and pay for APIs instantly. 40+ live endpoints across every category. No subscriptions, just per-call payments.
          </p>
          
          <form onSubmit={(e) => { e.preventDefault(); search() }} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search APIs... (weather, finance, models...)"
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-[15px] font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl text-[15px] transition-all shadow-lg shadow-blue-600/10 hover:-translate-y-0.5">
              Search
            </button>
          </form>
          <div className="mt-6 inline-block bg-gray-50 border border-gray-200 rounded-lg p-3 text-[13px] font-mono text-blue-600 shadow-sm">
            <span className="text-gray-500 font-sans text-xs uppercase tracking-wider font-semibold block mb-1">AI Agent Discovery Route</span>
            GET /api/marketplace/discover?need=weather&budget=0.001
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 pb-24 flex flex-col lg:flex-row gap-10">

        {/* Sidebar */}
        <div className="lg:w-64 shrink-0 space-y-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm zentra-card">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Category</p>
            <div className="space-y-1.5">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-[14px] font-medium flex items-center gap-3 transition-colors ${
                    category === cat
                      ? 'bg-blue-50 text-blue-600 border border-blue-100'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}>
                  <span className="text-lg">{CAT_ICONS[cat]}</span> {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm zentra-card">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Max Price (USDC)</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} onBlur={search}
                placeholder="0.01" step="0.001" min="0"
                className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm zentra-card">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Sort By</p>
            <div className="space-y-1.5">
              {[{ v: 'popular', l: 'Most Popular' }, { v: 'price_asc', l: 'Cheapest First' }].map(o => (
                <button key={o.v} onClick={() => setSortBy(o.v as 'price_asc' | 'popular')}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-[14px] font-medium transition-colors ${
                    sortBy === o.v
                      ? 'bg-blue-50 text-blue-600 border border-blue-100'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">APIs</h2>
            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
              {loading ? 'Searching...' : `${results.length} results`}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm animate-pulse zentra-card h-[220px]">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl" />
                    <div className="h-6 w-20 bg-gray-100 rounded-full" />
                  </div>
                  <div className="h-4 bg-gray-100 rounded w-2/3 mb-3" />
                  <div className="h-3 bg-gray-50 rounded w-3/4 mb-6" />
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-24 bg-gray-100 rounded-xl" />
                    <div className="h-8 w-16 bg-gray-50 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-3xl border border-gray-200 shadow-sm zentra-card">
              <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-400 mx-auto mb-6">
                <Search size={32} />
              </div>
              <p className="text-xl font-bold text-gray-900 mb-2">No APIs found</p>
              <p className="text-[15px] font-medium text-gray-500 max-w-sm mx-auto">Try adjusting your search terms, changing the category, or increasing the max price.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {results.map(api => (
                <div key={api.id}
                  className="group bg-white hover:bg-gray-50/50 border border-gray-200 hover:border-gray-300 rounded-3xl p-6 transition-all hover:shadow-xl hover:-translate-y-1 relative zentra-card flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 shadow-sm">
                        {CAT_ICONS[api.category] || <Plug size={18} />}
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                          {api.reliabilityScore}% uptime
                        </span>
                      </div>
                    </div>

                    <h3 className="font-mono text-[14px] font-semibold text-gray-900 truncate mb-2 group-hover:text-blue-600 transition-colors" title={api.endpointMasked}>
                      {api.endpointMasked}
                    </h3>
                    
                    {api.description ? (
                      <p className="text-[13px] text-gray-500 leading-relaxed font-medium line-clamp-2 mb-4 h-10">{api.description}</p>
                    ) : (
                      <div className="h-10 mb-4" />
                    )}
                  </div>

                  <div>
                    {api.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {api.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{tag}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center text-[12px] font-medium text-gray-500">
                         <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" /><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" /></svg> {api.totalCalls.toLocaleString()} calls</span>
                         <span className="flex items-center gap-1.5 line-clamp-1">
                           <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM10 6a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 000-2h-3V7a1 1 0 00-1-1z" clipRule="evenodd" /></svg> 
                           {api.paymeshSubdomain || api.developerEns || `${api.developerWallet.slice(0, 4)}...${api.developerWallet.slice(-4)}`}
                         </span>
                       </div>

                      <div className="flex justify-between items-end mt-2">
                        <div>
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Price / Call</p>
                          <p className="text-xl font-black tracking-tight text-gray-900">{api.price} <span className="text-sm font-semibold text-gray-500">USDC</span></p>
                        </div>
                        <button onClick={() => setTryApi(api)}
                          className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-[13px] font-bold transition-colors shadow-md hover:shadow-lg">
                          Try API
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {tryApi && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-fade-up zentra-card border border-gray-100">
            <div className="flex justify-between items-start mb-6">
              <div className="pr-8">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-3 border border-blue-100">
                  <span>{CAT_ICONS[tryApi.category]}</span> {tryApi.category}
                </div>
                <h3 className="font-bold text-2xl text-gray-900 mb-1">Try this API</h3>
                <p className="text-[14px] text-gray-500 font-mono tracking-tight">{tryApi.endpointMasked}</p>
              </div>
              <button onClick={() => setTryApi(null)}
                className="text-gray-400 hover:text-gray-900 w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-all text-lg absolute top-6 right-6">✕</button>
            </div>
            
            <div className="space-y-6">
              {tryApi.description && <p className="text-[14px] font-medium text-gray-600 leading-relaxed">{tryApi.description}</p>}

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
                {[
                  ['Price per call', `${tryApi.price} USDC`, true],
                  ['Pay receiver', `${tryApi.payTo.slice(0, 10)}...${tryApi.payTo.slice(-6)}`, false],
                  ['System Uptime', `${tryApi.reliabilityScore}%`, false],
                  ['Total Calls', tryApi.totalCalls.toLocaleString(), false],
                ].map(([k, v, isHighlight]) => (
                  <div key={k as string} className="flex justify-between items-center">
                    <span className="text-gray-500 text-[13px] font-semibold">{k}</span>
                    <span className={`text-[13px] font-bold ${isHighlight ? 'text-gray-900 text-[15px] bg-white px-3 py-1 border border-gray-200 rounded-lg shadow-sm' : 'text-gray-800 font-mono'}`}>{v}</span>
                  </div>
                ))}
              </div>
              
              <a href={`/checkout?amount=${tryApi.price}&payTo=${tryApi.payTo}&network=base-sepolia&api=${encodeURIComponent(tryApi.endpoint)}`}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-[15px] transition-transform shadow-xl shadow-blue-500/20 hover:-translate-y-0.5">
                Pay {tryApi.price} USDC → Get Access
              </a>
              
              <div className="pt-4 border-t border-gray-100">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">For AI agents:</p>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-[13px] font-mono text-emerald-400 shadow-inner overflow-x-auto whitespace-nowrap">
                  {`GET /api/marketplace/discover?need=${tryApi.category.toLowerCase()}&budget=${tryApi.price}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
