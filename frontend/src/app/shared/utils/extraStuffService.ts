import { Injectable, WritableSignal, effect, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ExtraStuffService {
  public stateToLoad: WritableSignal<string> = signal('');

  constructor(private http: HttpClient) {
    //     effect(() => {
    //       const stateToLoad = this.stateToLoad();
    //       console.log('stateToLoad', stateToLoad);
    //     });
  }
}
