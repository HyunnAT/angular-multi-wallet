import { Injectable } from '@angular/core';
import { BaseConnection, ConnectionProvider } from './base-connection';
import { MetaMaskConnection } from './metamask-connection';
import { WalletConnectConnection } from './wallet-connect-connection';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {

  private currentConnection?: BaseConnection;

  constructor() {
  }

  public get connection(): BaseConnection | undefined {
    return this.currentConnection;
  }

  public async connect(type: ConnectionProvider) {
    const connection = this.getConnection(type);
    const result = await connection.connect();
    if (result.success) {
      this.currentConnection = connection;
    }
    return result;
  }

  public disconnect() {
    this.currentConnection?.disconnect();
    this.currentConnection = undefined;
  }

  public get walletAddress() {
    return this.currentConnection?.subscribeAccountChanged();
  }

  public get chainId() {
    return this.currentConnection?.subscribeChainChanged();
  }

  private getConnection(type: ConnectionProvider) {
    switch (type) {
      case 'MetaMask':
        return new MetaMaskConnection();
      case 'WalletConnect':
        return new WalletConnectConnection();
      default:
        return new MetaMaskConnection();
    }
  }

}
