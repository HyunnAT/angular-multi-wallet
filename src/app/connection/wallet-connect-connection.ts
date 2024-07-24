import { createWeb3Modal, defaultConfig, Web3Modal } from "@web3modal/ethers";
import { BaseConnection, ConnectionInfo, ResponseWithoutData } from "./base-connection";
import { ethers, Provider, Signer } from "ethers";


export class WalletConnectConnection extends BaseConnection {

  private readonly modal: Web3Modal;
  private readonly ethersConfig = defaultConfig({
    auth: {
      email: false,
      socials: undefined
    },
    metadata: {
      name: 'Angular Craft',
      description: 'Angular Craft',
      icons: ['https://angular-craft.com/favicon.ico'],
      url: window.location.href
    },
  });

  private readonly chains: any[] = [
    {
      rpcUrl: 'https://cloudflare-eth.com',
      explorerUrl: 'https://etherscan.io',
      currency: 'ETH',
      name: 'Ethereum',
      chainId: 1
    },
    {
      rpcUrl: 'https://mainnet-rpc.helachain.com',
      explorerUrl: 'https://explorer.helachain.com',
      currency: 'HLUSD',
      name: 'HelaChain',
      chain: 8668
    }
  ]

  private waitingConnect = false;

  constructor() {
    super('WalletConnect');

    this.modal = createWeb3Modal({
      ethersConfig: this.ethersConfig,
      projectId: 'ce757c91d06126115684c7d23e3b1989',
      allowUnsupportedChain: true,
      chains: [...this.chains]
    });

    this.modal.subscribeState((state) => {
      console.log(state);
      this.onChainChanged();
      if (state.selectedNetworkId) {
        this.waitingConnect = false;
        this.onConnect();
      } else {
        this.onDisconnect();
      }
    });

    this.modal.subscribeShouldUpdateToAddress((address) => {
      console.log(address);
      this.onAccountChanged();
    });

    this.modal.subscribeWalletInfo((walletInfo) => {
      console.log(walletInfo);
    });
  }


  public override getWalletAddress(): Promise<string | null | undefined> {
    return Promise.resolve(this.walletAddress ??= this.modal.getAddress());
  }

  public override getChainId(): Promise<number | null | undefined> {
    return Promise.resolve(this.chainId ??= this.modal.getChainId());
  }

  public override getProvider(): Promise<Provider> {
    return Promise.resolve(new ethers.BrowserProvider(this.modal.getWalletProvider() as ethers.Eip1193Provider));
  }

  public override async getSigner(): Promise<Signer> {
    const provider = await this.getProvider() as ethers.BrowserProvider;
    return provider.getSigner();
  }

  public override async connect(): Promise<ConnectionInfo> {
    try {
      await this.modal.open();
      this.waitingConnect = true;
      while (this.waitingConnect) {
        await delay(1000);
      }

      return ConnectionInfo.success({ walletAddress: this.walletAddress, chainId: this.chainId, provider: this.provider }) as ConnectionInfo;
    } catch (error) {
      console.error(error);
      return ConnectionInfo.error('Failed to connect to WalletConnect');
    }
  }

  public override async disconnect(): Promise<void> {
    await this.modal.disconnect();
  }

  public override async switchChain(chainId: number): Promise<ResponseWithoutData> {
    try {
      await this.modal.switchNetwork(chainId);
      return ResponseWithoutData.success();
    } catch (error) {
      console.error(error);
      return ResponseWithoutData.error('Failed to switch network');
    }
  }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
