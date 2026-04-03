'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Wallet, LogOut, Loader2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WalletConnectProps {
    className?: string;
}

export function WalletConnect({ className }: WalletConnectProps) {
    const { address, isConnected } = useAccount();
    const { connect, connectors, isPending } = useConnect();
    const { disconnect } = useDisconnect();
    const [mounted, setMounted] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    const handleConnect = () => {
        const coinbaseConnector = connectors.find(c => c.id === 'coinbaseWalletSDK');
        const connector = coinbaseConnector || connectors[0];
        if (connector) connect({ connector });
    };

    const formatAddress = (addr?: string) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

    if (isConnected && address) {
        return (
            <div className={`relative ${className || ''}`}>
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-2 bg-white border border-gray-100 px-4 py-2 rounded-xl zentra-shadow hover:bg-gray-50 transition-all text-[13px] font-semibold text-gray-900"
                >
                    <div className="w-2 h-2 bg-emerald-500 rounded-full pulse-dot" />
                    <span className="font-mono">{formatAddress(address)}</span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl zentra-shadow p-2 z-50 overflow-hidden"
                            >
                                <div className="px-3 py-2 border-b border-gray-50 mb-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Connected to Base</p>
                                </div>
                                <button
                                    onClick={() => {
                                        disconnect();
                                        setShowMenu(false);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 hover:text-red-500 hover:bg-red-50 transition-all"
                                >
                                    <LogOut size={16} />
                                    Disconnect
                                </button>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <button
            onClick={handleConnect}
            disabled={isPending}
            className={`group relative flex items-center gap-2.5 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-[14px] font-medium transition-all shadow-sm active:scale-95 disabled:opacity-70 ${className || ''}`}
        >
            {isPending ? (
                <Loader2 size={16} className="animate-spin" />
            ) : (
                <Wallet size={16} className="group-hover:rotate-12 transition-transform" />
            )}
            <span>{isPending ? 'Connecting...' : 'Connect Wallet'}</span>
        </button>
    );
}
