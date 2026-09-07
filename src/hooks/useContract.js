import { usePublicClient, useWalletClient } from "wagmi";
import { contractAddress, contractABI } from "../config/contract";
import { useMarketplaceStore } from "../stores/useMarketplaceStore";

// 当前链上的 viem public client / wallet client，组件可直接读取合约
export function useContractRead() {
  const publicClient = usePublicClient();
  const chainId = useMarketplaceStore((s) => s.chainId);
  return { publicClient, chainId, address: contractAddress, abi: contractABI };
}

export function useContractWrite() {
  const { data: walletClient } = useWalletClient();
  const currentAccount = useMarketplaceStore((s) => s.currentAccount);
  return { walletClient, account: currentAccount, address: contractAddress, abi: contractABI };
}

export { usePublicClient, useWalletClient };
