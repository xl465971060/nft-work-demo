# NFT Marketplace 项目技术栈详解

> 基于对 ~/Web3ProjectAll/nft 源码的实际阅读整理（2026-09-04）。

## 1. 项目概述

一个类 OpenSea 的 NFT 市场 DApp，前后端一体（单仓库）：

- 智能合约负责 NFT 铸造、上架、托管与交易结算
- React 前端负责浏览、上传、购买与个人资产展示
- IPFS（Pinata）负责 NFT 图片与元数据存储
- 当前所有网络配置指向本地 Hardhat 节点（chainId 31337）

三个角色：

| 角色 | 能力 |
| --- | --- |
| 买家 | 浏览市场、按价购买 NFT（executeSale） |
| 卖家 | 上传文件+元数据到 IPFS、铸造并上架 NFT（createToken） |
| 管理员(owner) | 修改上架费 listPrice（updateListPrice，仅合约部署者） |

业务流：

1. 卖家填写名称/描述/价格，上传图片 → 上传到 Pinata（pinFileToIPFS）
2. 前端组装元数据 JSON（name/description/price/image）→ 上传到 Pinata（pinJSONToIPFS）
3. 前端调用合约 createToken(metadataURI, price)，支付 0.01 ETH 上架费
4. 合约铸造 ERC-721 并把 NFT 托管进合约地址（escrow）
5. 买家调用 executeSale(tokenId, value=price) → NFT 转给买家、成交价转给卖家、上架费转给 owner
6. 前端读取链上 tokenURI → 转成 ipfs.io 网关 URL → axios 拉元数据渲染

## 2. 代码规模（排除 node_modules / lock 文件）

| 语言 | 文件数 | 行数 |
| --- | --- | --- |
| JavaScript | 19 | 986 |
| Solidity | 1 | 154 |
| CSS | 2 | 81 |
| Markdown | 1 | 60 |
| HTML | 1 | 55 |
| JSON(除lock) | 5 | 112 |

主要源码：合约 154 行、前端 JS(含组件) 约 620 行、合约测试 120 行。

## 3. 技术栈分层

### 智能合约层（contracts/NFTMarketplace.sol）
- 语言：Solidity 0.8.26（开启优化器，runs=200）
- 合约：NFTMarketplace —— 继承 OpenZeppelin 4.7.3 的 ERC721URIStorage + Ownable，使用 Counters 管理 tokenId
- 核心函数：
  - createToken(string tokenURI, uint256 price) payable — 铸造+上架+托管
  - executeSale(uint256 tokenId) payable — 结算（NFT→买家、ETH→卖家、上架费→owner）
  - updateListPrice(uint256) onlyOwner — 管理员改上架费（默认 0.01 ETH）
  - getAllNFTs() / getMyNFTs() / getListedTokenForId() / getCurrentToken() — 查询
- 设计要点：listing 时 NFT 被 _transfer 到合约地址托管（中间人模式），executeSale 时再转给买家；成交价直接 seller.transfer

### 开发/部署工具链
- Hardhat 2.22.16（defaultNetwork: hardhat，本地链 chainId 31337）
- @nomiclabs/hardhat-ethers 2.0.6、@nomiclabs/hardhat-waffle 2.0.3、ethereum-waffle 3.4.4
- ethers.js 5.6.8（合约交互）
- solidity-coverage 0.8.14（覆盖率）
- dotenv 16.4.5（读取 .env 密钥）
- 脚本：scripts/deploy.js —— 部署并导出 address+ABI 到 src/Marketplace.json
- 测试：test/nftmarket-test.js（Waffle + Chai，正常/异常/辅助函数三组断言）—— `npx hardhat test`

### 前端层（src/，Create React App 5.0.1）
- React 18.1.0 + react-dom
- react-router-dom 6.3.0（路由：/ 市场、/sellNFT 上架、/nftPage/:tokenId 详情、/profile 资产）
- Tailwind CSS 3.0.24 + PostCSS 8 + Autoprefixer（样式）
- axios 0.27.2（拉取 IPFS 元数据、调用 Pinata API）
- web3modal 1.9.7（依赖已装，但当前代码未使用，直接操作 window.ethereum）
- 页面组件：Marketplace.js / SellNFT.js / NFTPage.js / Profile.js / Navbar.js + NFTTile.js（卡片）
- 工具：utils.js（Pinata URL → ipfs.io 网关 URL）、pinata.js（上传文件/JSON）
- react-app-rewired + config-overrides.js：为 ethers.js 做 Node polyfill（crypto-browserify、stream-browserify、buffer、assert、os、url、https-browserify、process）
- App.js 目前是占位（仅渲染 hello），实际入口与路由在 index.js，组件均已就绪

### 钱包/链交互
- MetaMask 注入的 window.ethereum（EIP-1193）
- Navbar 中硬编码 usedChainId = "0x7a69"（31337 本地链），连接时自动 wallet_switchEthereumChain
- ethers.providers.Web3Provider + signer 直连合约

### 存储层（IPFS）
- Pinata Cloud：pinFileToIPFS（图片，支持 region 副本策略）、pinJSONToIPFS（元数据）
- API 认证：REACT_APP_PINATA_KEY / REACT_APP_PINATA_SECRET（.env）
- 网关：上传返回 gateway.pinata.cloud/ipfs/{CID}；链上存 Pinata URL，前端读取时经 GetIpfsUrlFromPinata 转成 https://ipfs.io/ipfs/{CID}

### 部署托管
- Firebase Hosting（firebase.json）：public 指向 build/，SPA rewrite 全部路由回 index.html
- 部署链路：npm run build → firebase deploy；合约：npx hardhat node + npx hardhat run ./scripts/deploy.js --network localhost

### 预留/注释掉的网络配置（hardhat.config.js）
- Sepolia、Polygon Mumbai、Polygon Matic、Goerli（含 Alchemy URL 与 PRIVATE_KEY 注释），可取消注释启用

## 4. 目录结构

```
nft/
├── contracts/NFTMarketplace.sol   # 唯一合约（ERC-721 市场）
├── scripts/deploy.js              # 部署 + 导出 address/ABI → src/Marketplace.json
├── test/nftmarket-test.js         # Waffle/Chai 合约测试
├── hardhat.config.js              # 网络/编译配置（本地链 31337）
├── src/
│   ├── index.js                   # 入口 + 路由
│   ├── App.js                     # 占位（未接路由内容）
│   ├── Marketplace.json           # 部署产物（address + ABI）
│   ├── pinata.js                  # IPFS 上传封装
│   ├── utils.js                   # IPFS 网关 URL 转换
│   └── components/                # Navbar/Marketplace/SellNFT/NFTPage/Profile/NFTTile
├── config-overrides.js            # CRA Webpack polyfill 覆盖
├── tailwind.config.js / postcss.config.js
├── firebase.json                  # Firebase Hosting（SPA rewrite）
├── Sample_Marketplace.json        # 样例部署产物
└── screenshot/                    # README 用图（Pinata 配置截图）
```

## 5. 本地运行流程

```
npm install                      # 装依赖
npx hardhat node                 # 启动本地链 (31337)
npx hardhat run ./scripts/deploy.js --network localhost   # 部署，输出合约地址
npm start                        # 启动前端
# 浏览器需把 MetaMask 切到 localhost:8545 (chainId 31337)
```

## 6. 注意事项 / 潜在问题

1. App.js 是占位符，若页面空白应先接回路由（或直接在 App 里渲染 <Marketplace />）
2. .env 需要 REACT_APP_PINATA_KEY / REACT_APP_PINATA_SECRET，缺失时上传会失败
3. 链 ID 硬编码 0x7a69（本地链）：部署到测试网前需同步修改 Navbar usedChainId 与 hardhat.config.js
4. executeSale 使用 seller.transfer（发送者固定、gas 上限 2300），对合约卖家不友好（已知的反模式）；createToken 无 require(msg.sender != address(0)) 等细节
5. web3modal 已依赖但未接入，钱包连接是裸 window.ethereum 实现
6. 无后端服务：所有数据来自链上 + IPFS，无中心化数据库
