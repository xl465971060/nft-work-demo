import { hardhat, sepolia } from "wagmi/chains";

// 项目支持的链：本地 hardhat + Sepolia 测试网
export const configuredChains = [hardhat, sepolia];

// 默认链（首次连接无指定时用本地链 31337）
export const defaultChainId = hardhat.id;

export const chainsById = Object.fromEntries(
  configuredChains.map((c) => [c.id, c])
);
