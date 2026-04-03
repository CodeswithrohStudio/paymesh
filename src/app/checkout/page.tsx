'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { useAccount, useConfig, useSwitchChain, useChainId } from 'wagmi';
import { getConnectorClient } from '@wagmi/core';
import { WalletConnect } from '@/components/WalletConnect';
import {
  PAYMESH_CONTRACT_ADDRESS,
  USDC_ADDRESS,
  PAYMESH_ABI,
  USDC_ABI,
  toUSDCUnits,
} from '@/lib/contract';
import Link from 'next/link';
import { resolvePayMeshId } from '@/lib/resolver';
import { initXmtp, sendCreatorNotification } from '@/lib/xmtp';
import { CheckCircle2, UserCheck, CreditCard } from 'lucide-react';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const paymentInfo = {
    amount: searchParams.get('amount') || '0.001',
    token: searchParams.get('token') || 'USDC',
    network: searchParams.get('network') || 'base-sepolia',
    payTo: (searchParams.get('payTo') || '') as `0x${string}`,
    apiEndpoint: searchParams.get('api') || '',
  };

  const { address: walletAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const config = useConfig();
  const [txHash, setTxHash] = useState('');
  const [status, setStatus] = useState<'idle' | 'approving' | 'paying' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [provider, setProvider] = useState<any>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [resolvedAddress, setResolvedAddress] = useState<`0x${string}` | null>(null);
  const [resolvingId, setResolvingId] = useState(false);

  useEffect(() => {
    const resolve = async () => {
      if (!paymentInfo.payTo) return;
      if (paymentInfo.payTo.endsWith('.paymesh.eth')) {
        setResolvingId(true);
        const addr = await resolvePayMeshId(paymentInfo.payTo);
        setResolvedAddress(addr);
        setResolvingId(false);
      } else if (paymentInfo.payTo.startsWith('0x')) {
        setResolvedAddress(paymentInfo.payTo as `0x${string}`);
      }
    };
    resolve();
  }, [paymentInfo.payTo]);

  useEffect(() => {
    if (isConnected) {
      const getProv = async () => {
        try {
          const client = await getConnectorClient(config);
          setProvider(client.transport);
        } catch (e) {
          console.error('Error getting provider:', e);
        }
      };
      getProv();
    } else {
      setProvider(null);
    }
  }, [isConnected, config]);

  const handlePayment = async () => {
    if (!walletAddress || !provider || !resolvedAddress) {
      alert('Please connect your wallet first');
      return;
    }

    if (chainId !== baseSepolia.id) {
      try {
        switchChain({ chainId: baseSepolia.id });
        return;
      } catch (e) {
        console.error('Failed to switch chain:', e);
        alert('Please switch your wallet to Base Sepolia to continue.');
        return;
      }
    }

    setErrorMsg('');

    try {
      const walletClient = createWalletClient({
        chain: baseSepolia,
        transport: custom(provider),
      });

      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http('https://sepolia.base.org'),
      });

      const amountUnits = toUSDCUnits(paymentInfo.amount);

      // Step 1: Approve USDC spending
      setStatus('approving');
      const approveTx = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [PAYMESH_CONTRACT_ADDRESS, amountUnits],
        account: walletAddress as `0x${string}`,
      });

      await publicClient.waitForTransactionReceipt({ hash: approveTx });

      // Step 2: Call processPayment on PayMesh contract
      setStatus('paying');
      const payTx = await walletClient.writeContract({
        address: PAYMESH_CONTRACT_ADDRESS,
        abi: PAYMESH_ABI,
        functionName: 'processPayment',
        args: [resolvedAddress, amountUnits],
        account: walletAddress as `0x${string}`,
      });

      await publicClient.waitForTransactionReceipt({ hash: payTx });

      setTxHash(payTx);
      setStatus('success');

      // FIRE AND FORGET XMTP NOTIFICATION (background)
      try {
        const xmtpClient = await initXmtp(walletAddress);
        await sendCreatorNotification(xmtpClient, resolvedAddress, paymentInfo.apiEndpoint, paymentInfo.amount);
      } catch (xmtpErr) {
        console.warn("XMTP Notification skipped or failed:", xmtpErr);
      }

      // Step 3: Redirect or Fetch API
      if (paymentInfo.apiEndpoint) {
        const xPayment = [
          `amount=${paymentInfo.amount}`,
          `token=${USDC_ADDRESS}`,
          `network=base-sepolia`,
          `txHash=${payTx}`,
          `from=${walletAddress}`,
          `to=${paymentInfo.payTo}`,
        ].join(';');

        // Append to URL as query param (safest for CORS and middleware)
        const targetUrl = new URL(paymentInfo.apiEndpoint);
        targetUrl.searchParams.set('x_payment', xPayment);

        setTimeout(() => {
          fetch(targetUrl.toString(), {
            method: 'GET',
            headers: { 
              'X-Payment': xPayment,
              'Accept': 'application/json'
            },
          })
            .then(async res => {
              const data = await res.json();
              if (res.ok) {
                setApiResponse(data);
                // Directly open in new tab
                window.open(targetUrl.toString(), '_blank');
              } else {
                window.location.href = targetUrl.toString();
              }
            })
            .catch(() => {
              window.location.href = targetUrl.toString();
            });
        }, 1500);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMsg((err as any)?.shortMessage || (err as any)?.message || 'Transaction failed');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] flex items-center justify-center py-12 px-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-[24px] zentra-shadow border border-gray-100 p-8 animate-fade-up">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gray-900 border border-black flex items-center justify-center text-white font-bold text-sm shadow-inner shadow-white/10 mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">PayMesh Checkout</h1>
          <p className="mt-1 text-gray-500 font-medium text-[13px]">Monetized API Access via x402</p>
        </div>

        {/* Payment Details */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-200/50">
          <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Transaction Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-semibold text-gray-600">Total Amount</span>
              <span className="text-[15px] font-bold text-gray-900">{paymentInfo.amount} {paymentInfo.token}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-semibold text-gray-600">Network</span>
              <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Base Sepolia</span>
              </div>
            </div>
            <div className="flex justify-between items-start pt-2 border-t border-gray-200/50">
              <span className="text-[13px] font-semibold text-gray-600">Receiving Wallet</span>
              <div className="flex flex-col items-end">
                <span className="font-bold text-[13px] text-gray-900">{paymentInfo.payTo}</span>
                {resolvedAddress && paymentInfo.payTo.endsWith('.paymesh.eth') && (
                  <span className="font-mono text-[9px] text-emerald-500 mt-1 flex items-center gap-1">
                    <UserCheck size={10} /> Verified: {resolvedAddress.slice(0, 6)}...{resolvedAddress.slice(-4)}
                  </span>
                )}
                {resolvingId && <span className="text-[10px] text-blue-500 animate-pulse mt-1">Resolving ID...</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="mb-6 flex justify-center">
          <WalletConnect className="w-full justify-center" />
        </div>

        {isConnected && (
          <div className="space-y-4">
            {status === 'idle' && (
              <div className="space-y-3">
                <button
                  onClick={handlePayment}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl text-[15px] font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                >
                  Confirm Payment
                </button>
                <a
                  href={`https://buy.moonpay.com/?currencyCode=usdc_basehq${walletAddress ? `&walletAddress=${walletAddress}` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#f4f5f8] hover:bg-[#eceef2] text-gray-800 py-3 rounded-xl text-[14px] font-bold transition-all border border-gray-200/60"
                >
                  <img src="https://www.moonpay.com/assets/logo-icon-purple.svg" alt="MoonPay" className="w-4 h-4" />
                  Top up with MoonPay
                </a>
              </div>
            )}

            {(status === 'approving' || status === 'paying') && (
              <div className="text-center py-6 bg-blue-50/50 rounded-2xl border border-blue-100 animate-fade-up">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                <p className="font-bold text-gray-900 text-[14px]">
                  {status === 'approving' ? 'Step 1/2: Approving USDC...' : 'Step 2/2: Processing payment...'}
                </p>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mt-1">
                  Check your wallet for confirmation
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="py-6 text-center animate-fade-up">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="text-xl font-bold text-gray-900 tracking-tight mb-4">Payment Successful!</p>
                <div className="flex flex-col gap-3">
                  {txHash && (
                    <a
                      href={`https://sepolia.basescan.org/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] font-bold text-blue-600 bg-blue-50 py-2 px-4 rounded-xl hover:bg-blue-100 transition-colors inline-block mx-auto"
                    >
                      View on BaseScan ↗
                    </a>
                  )}
                  
                  <Link href="/dashboard" className="text-[12px] font-bold text-gray-500 hover:text-gray-900 transition-colors">
                    Back to Dashboard
                  </Link>
                </div>

                {/* API Response */}
                {apiResponse && (
                  <div className="mt-8 text-left">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">API Response:</p>
                    <div className="bg-[#1a1e2b] text-emerald-400 rounded-xl p-4 text-[12px] font-mono overflow-auto max-h-64 zentra-shadow">
                      <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {status === 'error' && (
              <div className="text-center py-6 bg-red-50/50 rounded-2xl border border-red-100 animate-fade-up">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-red-600 text-xl font-bold">!</span>
                </div>
                <p className="text-lg font-bold text-gray-900 mb-1">Payment Failed</p>
                {errorMsg && <p className="text-[11px] font-semibold text-red-500/80 max-w-[240px] mx-auto mb-5">{errorMsg}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => setStatus('idle')}
                    className="flex-1 bg-white border border-gray-200 px-4 py-3 rounded-xl text-[13px] font-bold hover:bg-gray-50 transition-all shadow-sm"
                  >
                    Try Again
                  </button>
                  <a
                    href={`https://buy.moonpay.com/?currencyCode=usdc_basehq&walletAddress=${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-[#7d00f5] hover:bg-[#6b00d6] text-white px-4 py-3 rounded-xl text-[13px] font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <CreditCard size={16} /> Buy USDC 
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest">
            x402 protocol · built on base
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--color-bg-main)] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
