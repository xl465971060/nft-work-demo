import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider, useAccount, useChainId } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig, queryClient } from "./config/wagmi";
import { useMarketplaceStore } from "./stores/useMarketplaceStore";
import SellNFT from "./components/SellNFT";
import Marketplace from "./components/Marketplace";
import Profile from "./components/Profile";
import NFTPage from "./components/NFTpage";

// 把 wagmi 的钱包状态（地址/链/连接状态）同步进 zustand store
function Web3Sync() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const setWeb3 = useMarketplaceStore((s) => s.setWeb3);
  const resetData = useMarketplaceStore((s) => s.resetData);
  const prevAccount = useMarketplaceStore((s) => s.currentAccount);

  useEffect(() => {
    setWeb3({ currentAccount: address || "", chainId, isConnected });
    if (prevAccount && prevAccount !== (address || "")) resetData();
  }, [address, chainId, isConnected, setWeb3, resetData, prevAccount]);

  return null;
}

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Web3Sync />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Marketplace />} />
            <Route path="/sellNFT" element={<SellNFT />} />
            <Route path="/nftPage/:tokenId" element={<NFTPage />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
