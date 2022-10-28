import React, { useEffect, useState } from "react";
import { useConnect } from "@stacks/connect-react";
import { StacksTestnet } from "@stacks/network";
import { StacksMocknet } from "@stacks/network";
import {
  AnchorMode,
  PostConditionMode,
  stringUtf8CV,
  standardPrincipalCV,
} from "@stacks/transactions";
import { userSession } from "./ConnectWallet";

import { makeStandardSTXPostCondition, callReadOnlyFunction, FungibleConditionCode } from '@stacks/transactions';
import { SetStateAction, useCallback, useRef } from 'react';
import useInterval from "@use-it/interval";


const ContractCallSendMsg = () => {
  const { doContractCall } = useConnect();


  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [post, setPost] = useState('');
  const [postedMessage, setPostedMassage] = useState("none");



  function handleMessageChange(event) {
    setPost(event.target.value);
  }

  function handleOpenContractCall() {
    doContractCall({
      network: new StacksMocknet(),
      anchorMode: AnchorMode.Any,
      contractAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
      contractName: "messagepost",
      functionName: "write-post",
      functionArgs: [stringUtf8CV(post)],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [makeStandardSTXPostCondition(userSession.loadUserData().profile.stxAddress.testnet, FungibleConditionCode.LessEqual, '1000000')],
      onFinish: (data) => {
        console.log("onFinish:", data);
        window
          .open(
            `https://explorer.stacks.co/txid/${data.txId}?chain=testnet`,
            "_blank"
          )
          .focus();
      },
      onCancel: () => {
        console.log("onCancel:", "Transaction was canceled");
      },
    });
  }



  // handle contract call get-post
  const getPost = useCallback(async () => {
    if (userSession.isUserSignedIn()) {
      //args for function being called
      const functionArgs = [
        standardPrincipalCV(userSession.loadUserData().profile.stxAddress.testnet)
      ]
      // network param for callReadOnly
      const network = new StacksMocknet();
      const senderAddress = `${userSession.loadUserData().profile.stxAddress.testnet}`;
      //read only function call
      const result = await callReadOnlyFunction({
        contractAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
        contractName: 'messagepost',
        functionName: 'get-post',
        functionArgs: [standardPrincipalCV(senderAddress)],
        senderAddress: senderAddress,
        network,
      });
      console.log("getting result", result);
      if (result.value) {
        setPostedMassage(result.value.data)
      }
    }
  }, []);

  // run get post on sing in to get message
  useEffect(() => {
    console.log("In useEffect")
    getPost()
  }, [userSession.isUserSignedIn()])

  // check the stacks API every 10 seconds loking for updates
  useInterval(getPost, 10000);


  if (!mounted || !userSession.isUserSignedIn()) {
    return null;
  }

  return (
    <div>
      <form

        onSubmit={() => handleOpenContractCall()}>
        <p>
          <h3>You can post your message
            <input
              className="Vote"
              type="text"
              value={post}
              onChange={handleMessageChange}
              placeholder="Enter message"
            /> For 1 STX</h3>
        </p>
        <button className="Send" type="submit">Post Message</button>
      </form>
      <h2>Message Posted:</h2>
      <button className="Vote">
        📯 {postedMessage} 📯
      </button>

    </div >
  );
};

export default ContractCallSendMsg;
