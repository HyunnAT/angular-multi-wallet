import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConnectionService } from './connection/connection.service';

// Fix serialize error for bigint
(BigInt.prototype as any).toJSON = function() { return this.toString(); };

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  providers: [ConnectionService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass'
})
export class AppComponent {
  title = 'angular-craft';

  public isMetaMask = false;
  public currentBlockNumber: number | undefined;

  constructor(private connectionService: ConnectionService) {}

  public get connectedAccount() {
    return this.connectionService.walletAddress;
  }

  public get currentNetwork() {
    return this.connectionService.chainId;
  }

  public async onClickMetaMask(): Promise<void> {
    this.isMetaMask = true;
    const connectionInfo = await this.connectionService.connect('MetaMask');
    console.log(connectionInfo);
  }

  public async onClickDisconnect(): Promise<void> {
    await this.connectionService.connection?.disconnect();
    this.currentBlockNumber = undefined;
  }

  public async onClickSwitchNetwork(): Promise<void> {
    await this.connectionService.connection?.switchChain(1);
  }

  public async onClickTransfer(): Promise<void> {

  }

  public async onClickWalletConnect(): Promise<void> {
    this.isMetaMask = false;
    const connectionInfo = await this.connectionService.connect('WalletConnect');
    console.log(connectionInfo);
  }
}
