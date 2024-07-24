import { ethers } from "ethers";
import { BehaviorSubject, Observable } from "rxjs";

export type ConnectionProvider = 'MetaMask' | 'WalletConnect';

export class Response<T> {
  success?: boolean;
  userRejected?: boolean;
  message?: string;
  data?: T;

  public static success<T>(data?: T): Response<T> {
    return {
      success: true,
      data
    };
  }

  public static error<T>(message: string): Response<T> {
    return {
      success: false,
      message: message
    };
  }

  public static userRejected<T>(): Response<T> {
    return {
      success: false,
      userRejected: true
    };
  }
}

export class ConnectionInfo extends Response<{ walletAddress: string, chainId: number, provider: ConnectionProvider } | undefined> {
}

export class ResponseWithoutData extends Response<null> {
}

export abstract class BaseConnection {
  protected walletAddress: string | null | undefined;
  protected chainId: number | null | undefined;
  protected provider: ConnectionProvider;

  protected chainSource = new BehaviorSubject<number | null | undefined>(null);
  protected accountSource = new BehaviorSubject<string | null | undefined>(null);
  protected connectionSource = new BehaviorSubject<boolean>(false);

  constructor(provider: ConnectionProvider) {
    this.provider = provider;
  }

  public abstract getWalletAddress(): Promise<string | null | undefined>;
  public abstract getChainId(): Promise<number | null | undefined>;
  public abstract getProvider(): Promise<ethers.Provider>;
  public abstract getSigner(): Promise<ethers.Signer>;
  public abstract connect(): Promise<ConnectionInfo>;
  public abstract disconnect(): Promise<void>;
  public abstract switchChain(chainId: number): Promise<ResponseWithoutData>;

  protected async onChainChanged(): Promise<void> {
    this.handleChainIdChanged();
  }

  protected async onAccountChanged(): Promise<void> {
    this.handleAccountChanged();
  }

  protected onConnect(): void {
    console.log('Connected');
    this.handleAccountChanged();
    this.handleChainIdChanged();
    this.connectionSource.next(true);
  }

  protected onDisconnect(): void {
    console.log('Disconnected');
    this.handleAccountChanged();
    this.handleChainIdChanged();
    this.connectionSource.next(false);
  }

  public subscribeChainChanged(): Observable<number | null | undefined> {
    return this.chainSource.asObservable();
  }

  public subscribeAccountChanged(): Observable<string | null | undefined> {
    return this.accountSource.asObservable();
  }

  public subscribeConnectionChanged(): Observable<boolean> {
    return this.connectionSource.asObservable();
  }

  private async handleChainIdChanged(): Promise<void> {
    this.chainId = undefined;
    this.chainId = await this.getChainId();
    this.chainSource.next(this.chainId);
    console.log('Chain changed', this.chainId);
  }

  private async handleAccountChanged(): Promise<void> {
    this.walletAddress = undefined;
    this.walletAddress = await this.getWalletAddress();
    this.accountSource.next(this.walletAddress);
    console.log('Account changed', this.walletAddress);
  }
}
