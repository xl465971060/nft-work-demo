// 兼容层：旧组件从 ../pinata 导入，统一转发到 lib/ipfs（JWT 认证实现）
export { uploadJSONToIPFS, uploadFileToIPFS } from "./lib/ipfs";
