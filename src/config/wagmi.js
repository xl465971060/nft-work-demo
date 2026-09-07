import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { hardhat, sepolia } from "wagmi/chains";
import { QueryClient } from "@tanstack/react-query";

// wagmi 配置：链 + 连接器（MetaMask injected）+ RPC
export const wagmiConfig = createConfig({
  chains: [hardhat, sepolia],
  connectors: [injected()],
  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"),
    [sepolia.id]: http(
      `https://eth-sepolia.g.alchemy.com/v2/${
        process.env.ALCHEMY_SEPOLIA_API_KEY || ""
      }`
    ),
  },
});

// wagmi v2 配套的 React Query 客户端
export const queryClient = new QueryClient();
