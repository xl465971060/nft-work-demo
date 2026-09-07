import Navbar from "./Navbar";
import { useEffect, useMemo } from "react";
import NFTTile from "./NFTTile";
import { useMarketplaceStore } from "../stores/useMarketplaceStore";

export default function Profile() {
  const myItems = useMarketplaceStore((s) => s.myItems);
  const currentAccount = useMarketplaceStore((s) => s.currentAccount);
  const isConnected = useMarketplaceStore((s) => s.isConnected);
  const fetchMyNFTs = useMarketplaceStore((s) => s.fetchMyNFTs);

  useEffect(() => {
    if (isConnected) fetchMyNFTs();
  }, [isConnected, currentAccount, fetchMyNFTs]);

  const totalPrice = useMemo(
    () =>
      myItems
        .reduce((sum, i) => sum + Number(i.price || 0), 0)
        .toPrecision(3),
    [myItems]
  );

  return (
    <div className="profileClass" style={{ minHeight: "100vh" }}>
      <Navbar></Navbar>
      <div className="profileClass">
        <div className="flex text-center flex-col mt-11 md:text-2xl text-white">
          <div className="mb-5">
            <h2 className="font-bold">Wallet Address</h2>
            {currentAccount}
          </div>
        </div>
        <div className="flex flex-row text-center justify-center mt-10 md:text-2xl text-white">
          <div>
            <h2 className="font-bold">No. of NFTs</h2>
            {myItems.length}
          </div>
          <div className="ml-20">
            <h2 className="font-bold">Total Value</h2>
            {totalPrice} ETH
          </div>
        </div>
        <div className="flex flex-col text-center items-center mt-11 text-white">
          <h2 className="font-bold">Your NFTs</h2>
          <div className="flex justify-center flex-wrap max-w-screen-xl">
            {myItems.map((value, index) => {
              return <NFTTile data={value} key={index}></NFTTile>;
            })}
          </div>
          <div className="mt-10 text-xl">
            {myItems.length === 0
              ? "Oops, No NFT data to display (Are you logged in?)"
              : ""}
          </div>
        </div>
      </div>
    </div>
  );
}
