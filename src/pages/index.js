import Head from "next/head";
import { ethers } from "ethers";
import { useEffect, useState } from "react";

import ABI from "@utils/WavePortal.json";

// const contractAddress = "0xF2D48C77FbAABE1fFE3C6C476F0a1f4898aa70E1";
// const contractAddress = "0x2a5F59E095ad5A7175b6E6fe493e5fB7C56B0558";
const contractAddress = "0x1a68214B31F7A61814EF37FB55cA13025E16275A";
const contractABI = ABI.abi;

export default function Home() {
  // Store user's public wallet
  const [currentAccount, setCurrentAccount] = useState(null);
  const [isMining, setIsMining] = useState(false);
  const [allWaves, setAllWaves] = useState([]);
  const [waveCount, setWaveCount] = useState(0);
  const [waveMessage, setWaveMessage] = useState("");
  const [waveModal, setWaveModal] = useState(false);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      // Check if  we have etherium
      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      // Check if we are authorized to access the users wallet
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found");
      }
    } catch {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const waves = await wavePortalContract.getAllWaves();

        // let wavesCleaned = [];
        // waves.forEach((wave) => {
        //   wavesCleaned.push({
        //     address: wave.waver,
        //     timestamp: new Date(wave.timestamp * 1000),
        //     message: wave.message,
        //   });
        // });

        let wavesCleaned = waves.map((wave) => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        // Reads from the Blockchain  - Are free
        getWaveCount();

        // Writes to the blockchain
        const waveTxn = await wavePortalContract.wave(waveMessage, {
          gasLimit: 300000,
        });
        setIsMining(true);
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        setIsMining(false);
        console.log("Mined -- ", waveTxn.hash);

        getWaveCount();
        // getAllWaves();
        setWaveMessage("");
        setWaveModal(false);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
      alert(error);
    }
  };

  const getWaveCount = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        // Reads from the Blockchain  - Are free
        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieve total wave count...", count.toNumber());
        setWaveCount(count.toNumber());
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [currentAccount]);

  useEffect(() => {
    getWaveCount();
  }, []);

  /**
   * Listen in for emitter events!
   */
  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  return (
    <div>
      <Head>
        <title>👋 Wave At Me</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="mainContainer">
        <div className="hero">
          <h1 className="hero__title">👋 Hey there!</h1>
          <span className="wave__count">{waveCount}</span>

          <p className="hero__subtitle">
            I am Ore and I am a software developer? Connect your Ethereum wallet
            and wave at me!
          </p>

          {!currentAccount ? (
            <button type="button" className="btn" onClick={connectWallet}>
              Connect to Wallet
            </button>
          ) : (
            <button
              type="button"
              className="btn primary-btn"
              onClick={() => {
                setWaveModal(!waveModal);
              }}
              disabled={isMining}
            >
              <i className="sp">👋</i>
              Wave at Me
            </button>
          )}
        </div>
        <dialog className="wave-modal" open={waveModal}>
          <form
            method="dialog"
            onSubmit={(e) => {
              e.preventDefault();
              wave();
            }}
            className="wave-form"
          >
            <p>
              <label>Message (Optional)</label>
              <textarea
                value={waveMessage}
                onChange={(e) => {
                  setWaveMessage(e.target.value);
                }}
              />
            </p>
            <menu>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setWaveMessage("");
                  setWaveModal(!waveModal);
                }}
              >
                Cancel
              </button>
              <button
                className="btn primary-btn"
                onClick={wave}
                disabled={isMining}
              >
                {isMining ? (
                  <i className="gg-spinner-two sp" />
                ) : (
                  <i className="sp">👋</i>
                )}
                Wave at Me!
              </button>
            </menu>
          </form>
        </dialog>
        <div className="waves">
          <h3 style={{ fontWeight: "normal" }}>Waves</h3>
          {allWaves.map((wave, index) => {
            return (
              <div key={index} className="wave">
                <div className="wave__message">{wave.message}</div>
                <div className="wave__from">{wave.address}</div>
                <div className="wave__timestamp">
                  {wave.timestamp.toDateString()}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
