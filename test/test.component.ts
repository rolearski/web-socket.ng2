import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

import { Subscription } from 'rxjs';
import { QueueingSubject } from 'queueing-subject';
import { Connection } from 'rxjs-websockets';
import  websocketConnect from 'rxjs-websockets';

import { WebSocketComponent, TestWebSocketService } from '../web-socket';

/***
*  WebSocketComponent and WebSocketService offer the same functionality
*  use only one of them
***/

@Component({
  selector: 'test',
  // place in app module providers: [ TestWebSocketService ],
  styleUrls: [ './test.component.css' ],
  templateUrl: './test.component.html'
})
export class TestComponent implements OnInit, OnDestroy {
  public localCall = { value: '' };
  public localResult = { value: '' };
  private debug: boolean = process.env.ENV === 'development';
  private id = Date.now();

  @ViewChild('websocket')
  private webSocketComponent: WebSocketComponent;

  constructor(private webSocketService: TestWebSocketService) {}

  public ngOnInit() {
    if (this.debug) {
      console.log(this.id, ' hello Test component & Web socket');
      // console.log(this.webSocketComponent);
      // console.log(this.webSocketService);
    }
  }

  public ngOnDestroy() {
    if (this.debug) {
      console.log(this.id, ' bye Test component');
    }
  }

  // callback no this
  public cbk(obj: any, that: any) {
      // tslint:disable-next-line:curly
      if (that.debug) {
        console.log(that.id, ' received object:', obj);
      }
      that.localResult.value = JSON.stringify(obj);
  }

  public submit(value: string) {
    if (this.debug) {
      console.log(this.id, ' sending');
    }
    this.webSocketComponent.call(value, this, this.cbk);
    // this.webSocketService.call(value, this, this.cbk);
    }
}
