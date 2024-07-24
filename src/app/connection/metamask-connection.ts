import { ethers, Provider, Signer } from "ethers";
import { BaseConnection, ConnectionInfo, ResponseWithoutData } from "./base-connection";
import MetaMaskSDK, { SDKProvider } from "@metamask/sdk";



export class MetaMaskConnection extends BaseConnection {

  private readonly metaMaskSdk: MetaMaskSDK;

  constructor() {
    super('MetaMask');

    this.metaMaskSdk = new MetaMaskSDK();


  }

  public override async getWalletAddress(): Promise<string | null | undefined> {
    const provider = await this.getMetaMaskProvider();
    const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
    return accounts.length > 0 ? accounts[0] : null;
  }

  public override async getChainId(): Promise<number | null | undefined> {
    const provider = await this.getMetaMaskProvider();
    const chainId = await provider.request({ method: 'eth_chainId' }) as string;
    return parseInt(chainId, 16);
  }

  public override async getProvider(): Promise<Provider> {
    const provider = await this.getMetaMaskProvider();
    return new ethers.BrowserProvider(provider as ethers.Eip1193Provider);
  }

  public override async getSigner(): Promise<Signer> {
    const provider = await this.getProvider() as ethers.BrowserProvider;
    return provider.getSigner();
  }

  public override async connect(): Promise<ConnectionInfo> {
    try {
      await this.waitForMetaMaskInitialization();
      const accounts = await this.metaMaskSdk.connect();
      if (Array.isArray(accounts) && accounts.length > 0) {
        this.walletAddress = accounts[0];
        this.chainId = await this.getChainId();

        this.metaMaskSdk.sdkProvider?.on('accountsChanged', (accounts) => {
          console.log('MetaMask accounts changed', accounts);
          this.onAccountChanged();
        });

        this.metaMaskSdk.sdkProvider?.on('chainChanged', (chain) => {
          console.log('MetaMask chain changed', chain);
          this.onChainChanged();
        });

        this.metaMaskSdk.sdkProvider?.on('connect', () => {
          console.log('MetaMask connected');
          this.onConnect();
        });

        this.metaMaskSdk.sdkProvider?.on('disconnect', () => {
          this.onDisconnect();
        });
        return ConnectionInfo.success({ walletAddress: this.walletAddress, chainId: this.chainId, provider: this.provider }) as ConnectionInfo;
      }

      return ConnectionInfo.error('Failed to connect to MetaMask');
    } catch (error: any) {
      console.error(error);
      if (error.code === 4001) {
        return ConnectionInfo.userRejected();
      }

      return ConnectionInfo.error('Failed to connect to MetaMask');
    }
  }

  public override async disconnect(): Promise<void> {
    await this.waitForMetaMaskInitialization();
    this.metaMaskSdk.terminate();
  }

  public override async switchChain(chainId: number): Promise<ResponseWithoutData> {
    const provider = await this.getMetaMaskProvider();
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ethers.toQuantity(chainId) }]
      });

      return ResponseWithoutData.success();
    } catch (error: any) {
      console.error(error);
      if (error.code === 4001) {
        return ResponseWithoutData.userRejected();
      }

      return ResponseWithoutData.error('Failed to switch chain');
    }
  }

  private async getMetaMaskProvider() {
    await this.waitForMetaMaskInitialization();

    return this.metaMaskSdk.getProvider() as SDKProvider;
  }

  private async waitForMetaMaskInitialization() {
    if (!this.metaMaskSdk.isInitialized()) {
      await this.metaMaskSdk.init();
    }
  }
}
