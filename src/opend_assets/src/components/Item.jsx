import React, { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import {Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { idlFactory } from "../../../declarations/nft";
import { idlFactory as tokenIdlFactory } from "../../../declarations/token";
import { opend } from "../../../declarations/opend";
import Button from "./Button";
import CURRENT_USER_ID from "../index";
import PriceLabel from "./PriceLabel";

function Item(props) {

  const [name, setName] = useState();
  const [ownerNFT, setOwnerNFT] = useState();
  const [imageNFT, setImage] = useState();
  const [button, setButton] = useState();
  const [priceInput, setPriceInput] = useState();
  const [loaderHidden, setLoaderHidden] = useState(true)
  const [blur, setBlur] = useState()
  const [sellStatus, setSellStatus] = useState("")
  const [priceLabel, setPriceLabel] = useState("")
  const [shouldDisplay, setDisplay] = useState(true);

  const id = props.id;

  const localHost = "http://localhost:8080/";
  const agent = new HttpAgent({host: localHost});
  // REMOVE THSI LINE IF YOU DEPLY LIVE 
  agent.fetchRootKey();
  let NFTActor;

  async function loadNFT() {
     NFTActor = await Actor.createActor(idlFactory, {
      agent,
      canisterId: id,
    })
    const name = await NFTActor.getName();
    const owner = await NFTActor.getOwner();
    const imageData = await NFTActor.getAsset();
    const imageContent = new Uint8Array(imageData);
    const image = URL.createObjectURL(new Blob([imageContent.buffer], {type: "image/png"}));

    setName(name);
    setOwnerNFT(owner.toText());
    setImage(image);

    if(props.role == "collection") {

      const nftIsListed = await opend.isListed(props.id);
      if(nftIsListed) {
        setBlur({filter: "blur(2px)"});
        setOwnerNFT("OpenD")
        setSellStatus("Listed")
      } else  {
        setButton(<Button handleClick={handleSell} text={"Sell"}/>)
      }
    } else if (props.role == "discover") {
      const originalOwner = await opend.getOriginalOwner(props.id)
      if (originalOwner.toText() != CURRENT_USER_ID.toText()) {
        setButton(<Button handleClick={handleBuy} text={"Buy"}/>)
      }
       const price = await opend.getNFTprice(props.id);
       setPriceLabel(<PriceLabel price={price.toString()} />)   

     }
    }

    

  useEffect(() => {
    loadNFT();
  },[])

    let price;
  function handleSell() {
    console.log("sell?")
    setPriceInput(          
      <input
      placeholder="Price in DANG"
      type="number"
      className="price-input"
      value={price}
      onChange={(e) => price=e.target.value}
  />
    )
    setButton(<Button handleClick={sellItem} text={"Confirm"}/>)
  }

  async function sellItem() {
    setBlur({filter: "blur(2px)"})
    setLoaderHidden(false)
    console.log("confirm?")
    const listingResult = await opend.listItem(props.id, Number(price));
    console.log("listing: " + listingResult)
    if (listingResult == "Success") {
      const openDId = await opend.getOpenDcanisterID();
      const transferResult = await NFTActor.transferOwnership(openDId);
      console.log("Trasnfer: " + transferResult);
      if (transferResult == "Success") {
        setLoaderHidden(true)
        setButton();
        setPriceInput();
        setOwnerNFT("OpenD");
        setSellStatus("Listed")
      }
    }
  }

  async function handleBuy() {
    console.log("Buying...")
    setLoaderHidden(false)
    const tokenActor = await Actor.createActor(tokenIdlFactory, {
      agent,
      canisterId: Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai"),
    })
    const sellerID = await opend.getOriginalOwner(props.id);
    const itemPrice = await opend.getNFTprice(props.id);

    const result = await tokenActor.transfer(sellerID, itemPrice);
    console.log(result)
    if (result == "Success") {
      const transferResult = await opend.completePurchase(props.id, sellerID, CURRENT_USER_ID);
      console.log("purchase: " + transferResult);
      setLoaderHidden(true);
      setDisplay(false);
    }

  }

  return (
    <div style={{ display: shouldDisplay ? "inline" : "none" }} className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={imageNFT}
          style={blur}
        />
<div className="lds-ellipsis" hidden={loaderHidden}>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
        <div className="disCardContent-root">
          {priceLabel}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
             <span className="purple-text"> {sellStatus}</span> {name}
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {ownerNFT}
          </p> 
          {priceInput}
          {button}
        </div>
      </div>
    </div>
  );
}

export default Item;
