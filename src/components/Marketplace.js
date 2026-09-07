import Navbar from "./Navbar";
import NFTTile from "./NFTTile";
import { useEffect } from "react";
import { useMarketplaceStore } from "../stores/useMarketplaceStore";

export default function Marketplace() {
  const items = useMarketplaceStore((s) => s.items);
  const fetchAllNFTs = useMarketplaceStore((s) => s.fetchAllNFTs);

  useEffect(() => {
    fetchAllNFTs();
  }, [fetchAllNFTs]);

  return (
    <div>
      <Navbar />
      <div className="flex flex-col place-items-center mt-20">
        <div className="md:text-xl font-bold text-white">Top NFTs</div>
        <div className="flex mt-5 justify-between flex-wrap max-w-screen-xl text-center">
          {items.map((value, index) => {
            return <NFTTile data={value} key={index}></NFTTile>;
          })}
        </div>
      </div>
    </div>
  );
}
