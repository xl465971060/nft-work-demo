import { create } from "zustand";

// 全局 UI 状态：加载中、错误提示（跨组件共享）
const useUIStore = create((set) => ({
  loading: false,
  error: "",
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

export { useUIStore };
