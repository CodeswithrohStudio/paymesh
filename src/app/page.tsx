'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { WalletConnect } from '@/components/WalletConnect'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, KeyRound, Banknote, Zap, ArrowRight, Upload, Link2, LogIn, Coins, Cpu, Check } from 'lucide-react'

// Bright Cyan theme Mesh Logo
const MeshLogo = () => (
  <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 4L34 11V29L20 36L6 29V11L20 4Z" stroke="#0f172a" strokeWidth="2.5" strokeLinejoin="round"/>
    <path d="M20 4V20M20 20L34 29M20 20L6 29M34 11L20 20L6 11" stroke="#0ea5e9" strokeWidth="2" strokeLinejoin="round"/>
    <circle cx="20" cy="20" r="3.5" fill="#0f172a"/>
    <circle cx="20" cy="4" r="2.5" fill="#0ea5e9"/>
    <circle cx="34" cy="11" r="2.5" fill="#0284c7"/>
    <circle cx="34" cy="29" r="2.5" fill="#0284c7"/>
    <circle cx="20" cy="36" r="2.5" fill="#0ea5e9"/>
    <circle cx="6" cy="29" r="2.5" fill="#0284c7"/>
    <circle cx="6" cy="11" r="2.5" fill="#0284c7"/>
  </svg>
)

export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Auto loop the solution flow steps
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const steps = [
    { icon: <Upload size={20} />, title: "Upload", desc: "Creator submits an endpoint and sets a USDC price.", color: "text-blue-500", bg: "bg-blue-100" },
    { icon: <Link2 size={20} />, title: "Generate", desc: "We assign a unique .paymesh.eth gateway.", color: "text-indigo-500", bg: "bg-indigo-100" },
    { icon: <LogIn size={20} />, title: "Access", desc: "User or AI agent hits the endpoint automatically.", color: "text-fuchsia-500", bg: "bg-fuchsia-100" },
    { icon: <Coins size={20} />, title: "Paid", desc: "Seamless L402 payment streams directly to you.", color: "text-emerald-500", bg: "bg-emerald-100" }
  ]

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-slate-900 font-sans">
      
      {/* Cyan Dream Background */}
      <div className="cyan-dream-bg"></div>
      <div className="noise-overlay"></div>

      {/* NAVBAR */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/50 backdrop-blur-2xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MeshLogo />
            <span className="font-bold text-xl tracking-tight text-slate-900 ml-1">PayMesh</span>
          </div>
          <div className="hidden md:flex items-center gap-10 font-medium text-[15px] text-slate-800">
             <Link href="/" className="hover:text-cyan-700 transition-colors">Home</Link>
             <Link href="/marketplace" className="hover:text-cyan-700 transition-colors">Marketplace</Link>
             <Link href="/dashboard" className="hover:text-cyan-700 transition-colors">Dashboard</Link>
          </div>
          <div className="flex items-center gap-4">
             <WalletConnect />
          </div>
        </div>
      </nav>

      {/* CHAPTER 1: THE HOOK (Hero) */}
      <main className="relative z-10 w-full pt-44 pb-32 flex flex-col items-center justify-center text-center px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel-heavy text-[13px] font-semibold text-cyan-800 mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Rebuilding the programmable web
          </div>
          
          <h1 className="text-5xl sm:text-[72px] font-bold tracking-tight text-slate-900 leading-[1.05] mb-8">
            APIs need keys.<br/>
            Articles need subscriptions.<br/>
            <span className="text-cyan-700">We think that&apos;s broken.</span>
          </h1>

          <p className="text-[19px] text-slate-900 max-w-2xl mx-auto font-medium leading-relaxed">
            Welcome to a protocol where anyone can put a price on their endpoint instantly. No accounts. No billing portals. Just pure, frictionless access powered by micro-payments.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-full shadow-xl transition-all text-[16px] flex items-center justify-center gap-2 group">
              Start building <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/marketplace" className="w-full sm:w-auto px-8 py-4 glass-panel-heavy hover:bg-white/80 text-slate-900 font-medium rounded-full transition-all text-[16px]">
              Explore the Mesh
            </Link>
          </div>
        </motion.div>

        {/* Floating Abstract Badges representing Friction vs Solution */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
          className="absolute top-1/4 left-[5%] hidden lg:flex items-center gap-3 px-4 py-3 glass-panel rounded-full text-slate-800 text-sm font-medium"
        >
          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500"><KeyRound size={16}/></div>
          <span className="line-through decoration-rose-300">Legacy API Keys</span>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
          className="absolute top-1/3 right-[5%] hidden lg:flex items-center gap-3 px-4 py-3 glass-panel rounded-full text-slate-800 text-sm font-medium"
        >
          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500"><Banknote size={16}/></div>
          <span className="line-through decoration-rose-300">Monthly Subs</span>
        </motion.div>
      </main>

      {/* CHAPTER 2: THE SOLUTION (Demo Flow) */}
      <section className="py-24 relative z-10 max-w-6xl mx-auto px-6">
        <div className="glass-panel-heavy rounded-[40px] p-8 md:p-16 shadow-2xl relative overflow-hidden">
          {/* Subtle inner flare */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-200/50 blur-[100px] rounded-full"></div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
            <div>
              <h2 className="text-[36px] font-bold text-slate-900 tracking-tight leading-tight mb-4">
                How PayMesh makes it seamless.
              </h2>
              <p className="text-[17px] text-slate-800 mb-10 leading-relaxed font-medium">
                We wrapped complex L402 payment routing into a single, intuitive workflow. Watch your endpoint go from private to monetized in four steps.
              </p>

              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-start gap-4 p-4 rounded-3xl transition-all duration-300 ${activeStep === idx ? 'bg-white/80 shadow-sm border border-white/60 scale-[1.02]' : 'opacity-60 hover:opacity-100'}`}
                    onClick={() => setActiveStep(idx)}
                    role="button"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${step.bg} ${step.color}`}>
                      {step.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-[17px]">{step.title}</h3>
                      <p className="text-[14px] text-slate-800 mt-1 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Screen for Steps */}
            <div className="h-[400px] bg-slate-900 rounded-[32px] shadow-xl border border-slate-800 p-6 flex flex-col relative overflow-hidden">
               <div className="flex items-center gap-2 mb-6">
                 <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                 <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                 <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
               </div>
               
               <div className="flex-1 flex items-center justify-center relative">
                 <AnimatePresence mode="wait">
                    {activeStep === 0 && (
                      <motion.div key="step0" initial={{opacity:0, y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}} className="w-full max-w-sm">
                        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                          <div className="text-xs text-slate-400 mb-2 uppercase tracking-widest font-semibold">Creator Portal</div>
                          <div className="space-y-4">
                            <div>
                               <div className="text-[11px] text-slate-500 mb-1">Target Endpoint</div>
                               <div className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm text-cyan-400 font-mono">https://api.weather.com</div>
                            </div>
                            <div>
                               <div className="text-[11px] text-slate-500 mb-1">Price per call (USDC)</div>
                               <div className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm text-white font-mono">0.05</div>
                            </div>
                            <div className="w-full bg-cyan-600 text-white font-semibold py-3 rounded-xl text-center text-sm shadow-[0_0_15px_rgba(8,145,178,0.4)]">Initialize Setup</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    {activeStep === 1 && (
                      <motion.div key="step1" initial={{opacity:0, y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}} className="text-center w-full max-w-sm">
                        <div className="inline-flex w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full items-center justify-center mb-6">
                          <Zap size={32} />
                        </div>
                        <h4 className="text-white font-semibold mb-2">Gateway Active</h4>
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-fuchsia-300 font-mono text-sm break-all">
                          https://weather.paymesh.eth
                        </div>
                        <p className="text-slate-500 text-xs mt-4">Global node routing generated.</p>
                      </motion.div>
                    )}
                    {activeStep === 2 && (
                      <motion.div key="step2" initial={{opacity:0, y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}} className="w-full max-w-sm">
                        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 font-mono text-xs text-slate-300 leading-relaxed">
                          <span className="text-slate-500">// Client Request</span><br/>
                          <span className="text-blue-400">GET</span> https://weather.paymesh.eth<br/>
                          <br/>
                          <span className="text-slate-500">// Intercepted via L402</span><br/>
                          <span className="text-rose-400">402 Payment Required</span><br/>
                          Header: <span className="text-amber-300">Www-Authenticate: L402</span><br/>
                          Invoice: <span className="text-emerald-300">lnbc1...</span>
                        </div>
                      </motion.div>
                    )}
                    {activeStep === 3 && (
                      <motion.div key="step3" initial={{opacity:0, y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}} className="text-center w-full max-w-sm">
                        <div className="relative inline-flex items-center justify-center mb-6">
                           <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 rounded-full"></div>
                           <div className="w-20 h-20 bg-slate-800 rounded-full border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
                             <Check size={40} strokeWidth={3} />
                           </div>
                        </div>
                        <h4 className="text-emerald-400 font-mono text-2xl font-bold mb-2">+0.05 USDC</h4>
                        <div className="text-slate-400 text-sm">Payment streamed successfully.<br/>Data packet delivered.</div>
                      </motion.div>
                    )}
                 </AnimatePresence>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 3: THE AHA MOMENT (AI Agents) */}
      <section className="py-24 relative z-10 max-w-5xl mx-auto px-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 glass-panel-heavy rounded-full flex items-center justify-center mb-8 shadow-sm">
            <Cpu size={36} className="text-cyan-600" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6">
            Designed for AI. Built for the future.
          </h2>
          <p className="text-[19px] text-slate-900 max-w-2xl font-medium leading-relaxed mb-12">
            AI agents can&apos;t sign up for monthly subsciptions or navigate billing portals. PayMesh uses standardized header protocols so algorithms can autonomously negotiate and purchase your data.
          </p>

          <div className="w-full glass-panel-heavy rounded-[32px] p-8 text-left border border-white/80 shadow-xl overflow-hidden relative">
             <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none"><MeshLogo /></div>
             <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1 border-r border-slate-200/50 pr-8">
                  <h3 className="font-bold text-slate-900 text-lg mb-2">Agent Query</h3>
                  <p className="text-sm text-slate-800 leading-relaxed">
                    Agent searches the PayMesh registry, discovers your endpoint, and automatically parses the L402 requirements to stream funds.
                  </p>
                </div>
                <div className="md:col-span-2 flex items-center">
                   <div className="w-full bg-slate-900 rounded-2xl p-5 font-mono text-xs text-slate-300 leading-[1.8] shadow-inner">
                     <span className="text-fuchsia-400">Agent</span>: Checking registry for "DeepSeek API"<br/>
                     <span className="text-cyan-400">Mesh</span>: Endpoint found at deepseek.paymesh.eth (0.02 USDC)<br/>
                     <span className="text-fuchsia-400">Agent</span>: Firing transaction tx_8f92a...<br/>
                     <span className="text-emerald-400">Mesh</span>: Verified. Delivering data payload.
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 4: CTA */}
      <section className="py-32 relative z-10 px-6">
        <div className="max-w-4xl mx-auto text-center glass-panel-heavy rounded-[40px] p-16 shadow-2xl relative overflow-hidden">
          {/* Intense gradient glow behind CTA */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-cyan-300/30 blur-[120px] rounded-full pointer-events-none"></div>

          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6">Start building the API economy.</h2>
            <p className="text-[19px] text-slate-900 mb-10 max-w-xl mx-auto font-medium">
              Join the network today. Upload your first API, set your price, and transform your code into a business.
            </p>
            <Link href="/dashboard" className="px-12 py-5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-full shadow-2xl transition-all hover:scale-105 text-[17px] inline-flex items-center gap-2">
              Launch Creator Dashboard <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/50 relative z-10 bg-white/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex flex-col lg:flex-row justify-between gap-12">
             <div>
                <div className="flex items-center gap-2 mb-4">
                  <MeshLogo />
                  <span className="font-bold text-xl text-slate-900">PayMesh</span>
                </div>
                <p className="text-slate-800 text-sm font-medium">
                  The frictionless protocol for the programmable web.
                </p>
             </div>
             <div className="flex gap-16 text-sm font-medium">
                <div className="space-y-4">
                  <div className="text-slate-900 font-bold mb-2">Protocol</div>
                  {['Documentation', 'Registry', 'Base Network'].map(link => (
                    <div key={link} className="text-slate-800 hover:text-cyan-700 cursor-pointer transition-colors">{link}</div>
                  ))}
                </div>
                <div className="space-y-4">
                  <div className="text-slate-900 font-bold mb-2">Company</div>
                  {['About Us', 'Contact', 'Terms'].map(link => (
                    <div key={link} className="text-slate-800 hover:text-cyan-700 cursor-pointer transition-colors">{link}</div>
                  ))}
                </div>
             </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-slate-200/50 text-[13px] text-slate-500 font-medium text-center">
            © 2026 PayMesh Network. Built for the hackathon.
          </div>
        </div>
      </footer>
    </div>
  )
}
