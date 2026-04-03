import { http, createConfig } from 'wagmi';
import { baseSepolia, sepolia } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [baseSepolia, sepolia],
  connectors: [
    coinbaseWallet({ 
      appName: 'PayMesh',
      preference: { options: 'all' }
    }),
    injected(),
  ],
  transports: {
    [baseSepolia.id]: http(),
    [sepolia.id]: http(),
  },
});
