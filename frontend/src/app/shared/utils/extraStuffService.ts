import { Injectable, WritableSignal, effect, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ExtraStuffService {
  public stateToLoad: WritableSignal<string> = signal('');
  public onboardingPublicRecipe: WritableSignal<number> = signal(0);
  public onboardingSubscribedRecipe: WritableSignal<number> = signal(0);
  public onboardingVisionRecipe: WritableSignal<number> = signal(0);

  constructor(private http: HttpClient) {
    //     effect(() => {
    //       const stateToLoad = this.stateToLoad();
    //       console.log('stateToLoad', stateToLoad);
    //     });
  }
}
