import { create } from "zustand";
import { getPublicClient, getWalletClient } from "@wagmi/core";
import { formatEther, parseEther } from "viem";
import { wagmiConfig } from "../config/wagmi";
import { contractAddress, contractABI } from "../config/contract";
import { defaultChainId } from "../config/chains";
import { GetIpfsUrlFromPinata } from "../utils";
import { useUIStore } from "./useUIStore";
import axios from "axios";

const setLoading = (v) => useUIStore.getState().setLoading(v);
const setError = (e) => useUIStore.getState().setError(e);

const fetchMetadata = async (uri) => {
  try {
    const res = await axios.get(GetIpfsUrlFromPinata(uri));
    return res.data;
  } catch (e) {
    return {};
  }
};

// 组装合约返回的 NFT 记录为前端展示对象
const formatItem = (i, meta) => ({
  price: formatEther(i.price),
  tokenId: Number(i.tokenId),
  seller: i.seller,
  owner: i.owner,
  image: GetIpfsUrlFromPinata(meta.image || ""),
  name: meta.name,
  description: meta.description,
});

export const useMarketplaceStore = create((set, get) => ({
  // ---- web3 数据（由 Web3Sync 从 wagmi hooks 同步进来）----
  currentAccount: "",
  chainId: null,
  isConnected: false,

  // ---- 业务数据 ----
  items: [],       // 市场上所有 NFT
  myItems: [],     // 当前账户拥有的 NFT

  // ---- 同步钱包状态（Web3Sync 组件调用）----
  setWeb3: ({ currentAccount, chainId, isConnected }) =>
    set({ currentAccount, chainId, isConnected }),

  // 账户切换时清空业务缓存
  resetData: () => set({ items: [], myItems: [] }),

  // ---- 读取市场上所有 NFT（公开读，无需钱包连接）----
  async fetchAllNFTs() {
    const { chainId } = get();
    const client = getPublicClient(wagmiConfig, { chainId: chainId || defaultChainId });
    setLoading(true);
    setError("");
    try {
      const all = await client.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: "getAllNFTs",
        args: [],
      });
      const items = await Promise.all(
        all.map(async (i) => {
          const uri = await client.readContract({
            address: contractAddress,
            abi: contractABI,
            functionName: "tokenURI",
            args: [i.tokenId],
          });
          const meta = await fetchMetadata(uri);
          return formatItem(i, meta);
        })
      );
      set({ items, myItems: [], });
    } catch (e) {
      setError(String(e.shortMessage || e.message || e));
    } finally {
      setLoading(false);
    }
  },

  // ---- 读取当前账户的 NFT（需要钱包连接）----
  async fetchMyNFTs() {
    const { currentAccount, chainId, isConnected } = get();
    if (!isConnected || !currentAccount) return;
    const client = getPublicClient(wagmiConfig, { chainId: chainId || defaultChainId });
    setLoading(true);
    setError("");
    try {
      const mine = await client.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: "getMyNFTs",
        args: [],
        account: currentAccount,
      });
      const myItems = await Promise.all(
        mine.map(async (i) => {
          const uri = await client.readContract({
            address: contractAddress,
            abi: contractABI,
            functionName: "tokenURI",
            args: [i.tokenId],
          });
          const meta = await fetchMetadata(uri);
          return formatItem(i, meta);
        })
      );
      set({ myItems });
    } catch (e) {
      setError(String(e.shortMessage || e.message || e));
    } finally {
      setLoading(false);
    }
  },

  // ---- 铸造并上架 NFT（卖家需先付 listPrice 上架费）----
  async createToken(metadataURL, priceEth) {
    const { currentAccount, chainId, isConnected } = get();
    if (!isConnected || !currentAccount) {
      setError("请先连接钱包");
      return { ok: false, error: "Not connected" };
    }
    const client = getPublicClient(wagmiConfig, { chainId: chainId || defaultChainId });
    setLoading(true);
    setError("");
    try {
      const listPrice = await client.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: "getListPrice",
        args: [],
      });
      const walletClient = getWalletClient(wagmiConfig, { chainId: chainId || defaultChainId });
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: "createToken",
        args: [metadataURL, parseEther(String(priceEth))],
        account: currentAccount,
        value: listPrice,
      });
      await client.waitForTransactionReceipt({ hash });
      await get().fetchAllNFTs();
      return { ok: true, hash };
    } catch (e) {
      const msg = String(e.shortMessage || e.message || e);
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  },

  // ---- 购买 NFT（买家支付 item.price）----
  async executeSale(tokenId, priceEth) {
    const { currentAccount, chainId, isConnected } = get();
    if (!isConnected || !currentAccount) {
      setError("请先连接钱包");
      return { ok: false, error: "Not connected" };
    }
    const client = getPublicClient(wagmiConfig, { chainId: chainId || defaultChainId });
    setLoading(true);
    setError("");
    try {
      const walletClient = getWalletClient(wagmiConfig, { chainId: chainId || defaultChainId });
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: "executeSale",
        // eslint-disable-next-line no-undef
        args: [BigInt(tokenId)],
        account: currentAccount,
        value: parseEther(String(priceEth)),
      });
      await client.waitForTransactionReceipt({ hash });
      await get().fetchAllNFTs();
      return { ok: true, hash };
    } catch (e) {
      const msg = String(e.shortMessage || e.message || e);
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  },
}));
