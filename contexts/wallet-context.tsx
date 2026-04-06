"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

import { Network as StellarToolsNetwork } from "@/constant/schema.client";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import {
  AlbedoModule,
  FreighterModule,
  HanaModule,
  ISupportedWallet,
  LobstrModule,
  StellarWalletsKit,
  WalletNetwork,
  XBULL_ID,
  parseError,
  xBullModule,
} from "@creit.tech/stellar-wallets-kit";
import {
  WALLET_CONNECT_ID,
  WalletConnectAllowedMethods,
  WalletConnectModule,
} from "@creit.tech/stellar-wallets-kit/modules/walletconnect.module";
import { Asset, Networks, Operation, Transaction, TransactionBuilder, rpc } from "@stellar/stellar-sdk";

export enum TxStatus {
  NONE,
  BUILDING,
  SIGNING,
  SUBMITTING,
  SUCCESS,
  FAIL,
}

export enum ContractErrorType {
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
  NOT_AUTHORIZED = "NOT_AUTHORIZED",
  NOT_ENOUGH_XLM = "NOT_ENOUGH_XLM",
  NOT_ENOUGH_NATIVE_ASSET = "NOT_ENOUGH_NATIVE_ASSET",
  NOT_ENOUGH_ASSET = "NOT_ENOUGH_ASSET",
}

export interface IWalletContext {
  connected: boolean;
  walletAddress: string;
  txStatus: TxStatus;
  lastTxHash: string | undefined;
  error: string | undefined;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signAndSubmit: (tx: Transaction | TransactionBuilder) => Promise<string | undefined>;
  createTrustlines: (assets: Asset[], network: Networks) => Promise<void>;
  setTxStatus: (status: TxStatus) => void;
  setError: (err: string | undefined) => void;
  setEnvironment: (environment: StellarToolsNetwork) => void;
}

const WalletContext = createContext<IWalletContext | undefined>(undefined);

let walletConnectModule: WalletConnectModule | undefined;
let walletKit: StellarWalletsKit | undefined;

function getWalletKit(network: Networks): StellarWalletsKit {
  if (!walletKit) {
    const swkNetwork = network === Networks.PUBLIC ? WalletNetwork.PUBLIC : WalletNetwork.TESTNET;

    walletConnectModule = new WalletConnectModule({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
      method: WalletConnectAllowedMethods.SIGN,
      url: process.env.NEXT_PUBLIC_APP_URL!,
      name: "Stellar Tools",
      description: "Stellar checkout payments",
      icons: [`${process.env.NEXT_PUBLIC_APP_URL}/favicon.ico`],
      network: swkNetwork,
    });

    walletKit = new StellarWalletsKit({
      network: swkNetwork,
      selectedWalletId: XBULL_ID,
      modules: [
        new xBullModule(),
        new FreighterModule(),
        new LobstrModule(),
        new AlbedoModule(),
        new HanaModule(),
        walletConnectModule,
      ],
    });
  }
  return walletKit;
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [txStatus, setTxStatus] = useState<TxStatus>(TxStatus.NONE);
  const [txHash, setTxHash] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [autoConnect, setAutoConnect] = useLocalStorageState("preferredWallet", "false");
  const [environment, setEnvironment] = useState<StellarToolsNetwork>("testnet");

  const rpcUrl = React.useMemo(() => {
    if (environment === "testnet") return process.env.NEXT_PUBLIC_RPC_URL_TESTNET!;
    else return process.env.NEXT_PUBLIC_RPC_URL_MAINNET!;
  }, []);

  const network = React.useMemo(() => {
    if (environment === "testnet") return Networks.TESTNET;
    else return Networks.PUBLIC;
  }, [environment]);

  const stellarRpc = new rpc.Server(rpcUrl);

  useEffect(() => {
    // @dev: timeout ensures chrome has the ability to load extensions
    // if the wallet is already connected, this will be a no-op
    if (!connected) {
      if (autoConnect !== undefined && autoConnect !== "false" && autoConnect !== WALLET_CONNECT_ID) {
        // attempt to auto-connect wallet
        setTimeout(() => {
          getWalletKit(network).setWallet(autoConnect);
          handleSetWalletAddress();
        }, 750);
      } else {
        // initialize wallet kit
        setTimeout(() => {
          getWalletKit(network);
        }, 750);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]);

  async function handleSetWalletAddress(): Promise<boolean> {
    try {
      const { address: publicKey } = await getWalletKit(network).getAddress();
      if (publicKey === "" || publicKey == undefined) {
        console.error("Unable to load wallet key: ", publicKey);
        return false;
      }
      setWalletAddress(publicKey);
      setConnected(true);
      return true;
    } catch (e: any) {
      console.error("Unable to load wallet information: ", e);
      return false;
    }
  }

  const connect = async () => {
    try {
      setIsLoading(true);
      const kit = getWalletKit(network);

      await kit.openModal({
        onWalletSelected: async (option: ISupportedWallet) => {
          if (option.id === WALLET_CONNECT_ID && walletConnectModule) {
            try {
              await walletConnectModule.disconnect();
            } catch (e) {
              console.error(e);
            }
          }

          kit.setWallet(option.id);
          const { address } = await kit.getAddress();
          setWalletAddress(address);
          setConnected(true);
          setAutoConnect(option.id);
        },
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    if (autoConnect === WALLET_CONNECT_ID && walletConnectModule) {
      await walletConnectModule.disconnect();
    }
    getWalletKit(network).disconnect();
    setConnected(false);
    setWalletAddress("");
    setAutoConnect("false");
  };

  const signAndSubmit = async (input: Transaction | TransactionBuilder): Promise<string | undefined> => {
    setTxStatus(TxStatus.SIGNING);
    try {
      const network = input instanceof Transaction ? input.networkPassphrase : (input as any).networkPassphrase;
      const xdr = input instanceof Transaction ? input.toXDR() : input.build().toXDR();

      const { signedTxXdr } = await getWalletKit(network as Networks).signTransaction(xdr, {
        address: walletAddress,
        networkPassphrase: network,
      });

      setTxStatus(TxStatus.SUBMITTING);
      const signedTx = new Transaction(signedTxXdr, network);

      let send_tx_response = await stellarRpc.sendTransaction(signedTx);
      let curr_time = Date.now();

      while (send_tx_response.status !== "PENDING" && Date.now() - curr_time < 5000) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        send_tx_response = await stellarRpc.sendTransaction(signedTx);
      }

      if (send_tx_response.status !== "PENDING") {
        setError("Failed to send transaction");
        console.error("Failed to send transaction: ", send_tx_response.hash, error);
        setTxStatus(TxStatus.FAIL);
        return undefined;
      }

      curr_time = Date.now();
      let get_tx_response = await stellarRpc.getTransaction(send_tx_response.hash);
      while (get_tx_response.status === "NOT_FOUND" && Date.now() - curr_time < 30000) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        get_tx_response = await stellarRpc.getTransaction(send_tx_response.hash);
      }

      if (get_tx_response.status === "NOT_FOUND") {
        setError("Unable to validate transaction success");
        console.error("Unable to validate transaction success: ", get_tx_response.txHash);
        setTxStatus(TxStatus.FAIL);
        return undefined;
      }

      let hash = signedTx.hash().toString("hex");

      setTxHash(hash);
      if (get_tx_response.status === "SUCCESS") {
        console.log("Successfully submitted transaction: ", hash);
        // stall for a bit to ensure data propagates to horizon
        await new Promise((resolve) => setTimeout(resolve, 500));
        setTxStatus(TxStatus.SUCCESS);
        return hash;
      } else {
        let error = parseError(get_tx_response);
        console.error(`Transaction failed: `, hash, error);
        setTxStatus(TxStatus.FAIL);
        return undefined;
      }
    } catch (e: any) {
      setError(e.message || "Execution failed");
      setTxStatus(TxStatus.FAIL);
      return undefined;
    }
  };

  const createTrustlines = async (assets: Asset[], network: Networks) => {
    setTxStatus(TxStatus.BUILDING);
    try {
      const account = await stellarRpc.getAccount(walletAddress);
      const builder = new TransactionBuilder(account, {
        fee: "1000",
        networkPassphrase: network,
      });

      assets.forEach((asset) => builder.addOperation(Operation.changeTrust({ asset })));

      await signAndSubmit(builder);
    } catch (e: any) {
      setError(e.message);
      setTxStatus(TxStatus.FAIL);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        connected,
        walletAddress,
        txStatus,
        lastTxHash: txHash,
        error,
        isLoading,
        connect,
        disconnect,
        signAndSubmit,
        createTrustlines,
        setTxStatus,
        setError,
        setEnvironment,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");
  return context;
};
