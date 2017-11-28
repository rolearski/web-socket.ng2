
import { Injectable } from '@angular/core';
import { QueueingSubject } from 'queueing-subject';
import { Observable } from 'rxjs/Observable';
import { Connection } from 'rxjs-websockets';
import websocketConnect from 'rxjs-websockets';
import 'rxjs/add/operator/share';

@Injectable()
export class WebSocket {
  // public messages: Observable<string>;
  protected connection: Connection;
  protected inputStream: QueueingSubject<string>;
  protected currentId = 0;

  public connect(url: string): Connection {
    if (this.connection) {
      return;
    }

    // Using share() causes a single websocket to be created when the first
    // observer subscribes. This socket is shared with subsequent observers
    // and closed when the observer count falls to zero.
    this.connection = websocketConnect(
      url,
      this.inputStream = new QueueingSubject<string>()
    );
    this.connection.messages.share();

    return this.connection;
  }

  public send(message: string): void {
    // If the websocket is not connected then the QueueingSubject will ensure
    // that messages are queued and delivered when the websocket reconnects.
    // A regular Subject can be used to discard messages sent when the websocket
    // is disconnected.
    this.inputStream.next(message);
  }
}
