import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export async function resolveENS(ensName: string): Promise<string | null> {
  try {
    const address = await publicClient.getEnsAddress({
      name: normalize(ensName),
    });
    return address;
  } catch (error) {
    console.error('ENS resolution failed:', error);
    return null;
  }
}

export async function reverseResolveENS(address: string): Promise<string | null> {
  try {
    const ensName = await publicClient.getEnsName({
      address: address as `0x${string}`,
    });
    return ensName;
  } catch (error) {
    console.error('Reverse ENS resolution failed:', error);
    return null;
  }
}
