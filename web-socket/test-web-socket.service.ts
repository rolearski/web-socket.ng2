import { Injectable } from '@angular/core';
import { WebSocketService } from './web-socket.service';

@Injectable()
export  class TestWebSocketService extends WebSocketService {

  constructor() {
    super('ws://127.0.0.1:11011');
    this.doConnect();
  }
}
