import { QueueingSubject } from 'queueing-subject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs';
import { Connection } from 'rxjs-websockets';
import { WebSocket } from './web-socket.socket';

// we can't instatiate the class, but we use can derive many services from it
export abstract class WebSocketService extends WebSocket {

  protected connection: Connection;
  protected connectionStatusSubscription: Subscription;

  protected currentId = 0;
  protected connectionsNunber = 0;
  protected clients: any[] = [];
  protected debug: boolean = process.env.ENV === 'development';
  // protected url: string = 'ws://demos.kaazing.com/echo/';

  constructor(protected url: string = 'ws://demos.kaazing.com/echo/') {
    super();
  }

  public setUrl(url: string) {
      this.url = url;
  }

  public doConnect() {
    // tslint:disable-next-line:curly
    if (this.debug) console.log('# url', this.url);
    this.connection = this.connect(this.url);

    this.connectionStatusSubscription = this.connection.connectionStatus.subscribe(
        (numberConnected: number) => {
          this.connectionsNunber = numberConnected;
          // tslint:disable-next-line:curly
          if (this.debug) console.log('# number of connected websockets:', numberConnected);
        }
     );
    // this.send('hello');
  }

  // TODO: disconnect, reconnect ...

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
        if (this.debug) console.log('# get response: ', response.id);
        that.clients[response.id].message(response, component);
        // remove callback from list. incl. time-outed callbacks
        that.clients[response.id] = null;
        let a = that.clients.filter((e) => e != null &&
                                           e.timestamp > Math.round(Date.now() / 1000));
        that.clients = a;
        // tslint:disable-next-line:curly
        if (this.debug) console.log('# that.clients', that.clients);
      }
    },
    (error: any) => {
      // tslint:disable-next-line:curly
      if (this.debug) console.log('# error: ', error);
      ferror(error);
    },
    () => {
      // tslint:disable-next-line:curly
      if (this.debug) console.log('# complete');
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
     this.send(JSON.stringify(obj));

     return sub;
  }
}
