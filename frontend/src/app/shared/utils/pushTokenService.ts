import { Injectable, WritableSignal, effect, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PushTokenService {
  private API_URL = `${environment.BACKEND}/pushTokens`;
  public unsavedPushToken: WritableSignal<string | null> = signal(null);

  constructor(private http: HttpClient) {
    effect(() => {
      if (this.unsavedPushToken()) {
        this.savePushToken(this.unsavedPushToken()!);
      }
    });
  }

  public savePushToken(token: string) {
    this.http.post(this.API_URL, { token }).subscribe(
      (response) => {
        console.log('Push token saved to server');
        this.unsavedPushToken.set(null);
      },
      (error) => {
        console.error('Error saving push token to server');
      }
    );
  }
}
