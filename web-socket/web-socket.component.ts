import {
    Attribute,
    Component,
    HostBinding, Input,
    OnDestroy,
    OnInit
  } from '@angular/core';
import { Subscription } from 'rxjs';
import { Connection } from 'rxjs-websockets';
import { WebSocket } from './web-socket.socket';

@Component({
  selector: 'web-socket',
  providers: [ WebSocket ],
  template: '<div>© ipsqos.net web socket component {{ version }}</div>'
})
export class WebSocketComponent implements OnInit, OnDestroy {

  @Input()
  @HostBinding('attr.version')
  public version: string = '1';

  protected connection: Connection;
  protected connectionStatusSubscription: Subscription;

  protected currentId = 0;
  protected connectionsNunber = 0;
  protected clients: any[] = [];
  protected debug: boolean = process.env.ENV === 'development';

  constructor(protected socket: WebSocket,
              // tslint:disable-next-line:no-attribute-parameter-decorator
              @Attribute('url') public url: string = 'ws://demos.kaazing.com/echo/') {
      // tslint:disable-next-line:curly
      if (this.debug) console.log('@ url', this.url);
  }

  public ngOnInit() {
    this.connection = this.socket.connect(this.url);

    this.connectionStatusSubscription = this.connection.connectionStatus.subscribe(
        (numberConnected: number) => {
          this.connectionsNunber = numberConnected;
          // tslint:disable-next-line:curly
          if (this.debug) console.log('@ number of connected websockets:', numberConnected);
        }
     );
    // this.socket.send('hello');
  }

  public ngOnDestroy() {
    this.connectionStatusSubscription.unsubscribe();
  }

  public call(str: string, sender: any,
              fmessage?: (obj: any, sender?: any) => void, /* succes */
              ferror?: (error: any) => void, /* error */
              timeout: number = 10 /* seconds */): any {

    let id: number = this.currentId++;
    this.clients[id] = { message : fmessage,
                         component: sender,
                         timestamp : timeout +
                                     Math.round(Date.now() / 1000) };
    let that = this;
    // let messagesSubscription: Subscription =
    this.sendMessage(JSON.parse(str), id,
    (message: string) => {
      let response = JSON.parse(message);
      if (that.clients[response.id]) {
        // execute callback
        let component = that.clients[response.id].component;
        // tslint:disable-next-line:curly
        if (this.debug) console.log('@ get response: ', response.id);
        that.clients[response.id].message(response, component);
        // remove callback from list. incl. time-outed callbacks
        that.clients[response.id] = null;
        let a = that.clients.filter((e) => e != null &&
                                           e.timestamp > Math.round(Date.now() / 1000));
        that.clients = a;
        // tslint:disable-next-line:curly
        if (this.debug) console.log('@ that.clients', that.clients);
      }
    },
    (error: any) => {
      // tslint:disable-next-line:curly
      if (this.debug) console.log('@ error: ', error);
      ferror(error);
    },
    () => {
      // tslint:disable-next-line:curly
      if (this.debug) console.log('@ complete');
    }
   );
  }

  protected sendMessage(obj: any, id: number,
                        message: (message: string) => void, /* succes */
                        error?: (error: any) => void, /* error */
                        complete?: () => void /* complete */
                        ): Subscription {

     let sub: Subscription;
     if (this.connectionsNunber === 0) {
         sub = this.connection.messages.subscribe(message, error, complete);
     }
     obj.id = id;
     this.socket.send(JSON.stringify(obj));

     return sub;
  }
}
