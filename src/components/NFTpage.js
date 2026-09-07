import Navbar from "./Navbar";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useMarketplaceStore } from "../stores/useMarketplaceStore";

export default function NFTPage() {
  const params = useParams();
  const tokenId = Number(params.tokenId);

  const items = useMarketplaceStore((s) => s.items);
  const currentAccount = useMarketplaceStore((s) => s.currentAccount);
  const fetchAllNFTs = useMarketplaceStore((s) => s.fetchAllNFTs);
  const executeSale = useMarketplaceStore((s) => s.executeSale);
  const [message, updateMessage] = useState("");

  useEffect(() => {
    fetchAllNFTs();
  }, [fetchAllNFTs]);

  const data = items.find((i) => i.tokenId === tokenId) || {};

  async function buyNFT() {
    updateMessage("Buying the NFT... Please Wait (Upto 5 mins)");
    const { ok, error } = await executeSale(tokenId, data.price);
    if (ok) {
      alert("You successfully bought the NFT!");
      updateMessage("");
    } else {
      alert("Buy error: " + error);
      updateMessage("");
    }
  }

  const isOwnerOrSeller =
    currentAccount &&
    (currentAccount.toLowerCase() === (data.owner || "").toLowerCase() ||
      currentAccount.toLowerCase() === (data.seller || "").toLowerCase());

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar></Navbar>
      <div className="flex ml-20 mt-20">
        <img src={data.image} alt="" className="w-2/5" />
        <div className="text-xl ml-20 space-y-8 text-white shadow-2xl rounded-lg border-2 p-5">
          <div>Name: {data.name}</div>
          <div>Description: {data.description}</div>
          <div>
            Price: <span className="">{data.price + " ETH"}</span>
          </div>
          <div>
            Owner: <span className="text-sm">{data.owner}</span>
          </div>
          <div>
            Seller: <span className="text-sm">{data.seller}</span>
          </div>
          <div>
            {data.tokenId ? (
              isOwnerOrSeller ? (
                <div className="text-emerald-700">
                  You are the owner of this NFT
                </div>
              ) : (
                <button
                  className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                  onClick={buyNFT}
                >
                  Buy this NFT
                </button>
              )
            ) : (
              <div className="text-white">Loading NFT data...</div>
            )}
            <div className="text-green text-center mt-3">{message}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
