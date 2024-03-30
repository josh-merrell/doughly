import { Injectable, WritableSignal, effect, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Store } from '@ngrx/store';
import {
  selectFriendByUserID,
  selectFriends,
} from 'src/app/profile/state/profile-selectors';
import { Observable, catchError, filter, from, mergeMap, of, take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PushTokenService {
  private API_URL = `${environment.BACKEND}/pushTokens`;
  public unsavedPushToken: WritableSignal<string | null> = signal(null);

  constructor(private http: HttpClient, private store: Store) {}

  public savePushToken(token: string) {
    this.http.post(this.API_URL, { token }).subscribe(
      () => {
        console.log('Push token saved to server for user.');
      },
      (error) => {
        console.error('Error saving push token to server: ', error);
      }
    );
  }

  public getOtherUserPushTokens(userID: string) {
    return this.http.get<string[]>(`${this.API_URL}/${userID}`);
  }

  public sendPushNotification(
    destTokens: Array<string>,
    type: string,
    data: any
  ) {
    return this.http.post(`${this.API_URL}/notification`, {
      destTokens,
      type,
      data,
    });
  }

  public getPushTokensAndSendNotification(
    settingName,
    type,
    data
  ): Observable<any> {
    return this.store.select(selectFriends).pipe(
      take(1),
      catchError((error) => {
        console.error('Error selecting friends: ', error);
        return of([]);
      }),
      mergeMap((friends) => from(friends)),
      mergeMap((friend: any) =>
        this.store.select(selectFriendByUserID(friend.userID)).pipe(
          take(1),
          filter(
            (friendProfile) =>
              !(
                friendProfile[settingName] === 'None' ||
                friendProfile[settingName] === 'Email Only'
              )
          ),
          mergeMap((friendProfile) =>
            this.getOtherUserPushTokens(friendProfile.userID).pipe(
              catchError((error) => {
                console.error('Error getting push tokens for user: ', error);
                return of([]);
              })
            )
          ),
          mergeMap((tokens) =>
            this.sendPushNotification(tokens, type, data).pipe(
              catchError((error) => {
                console.error('Error sending push notification: ', error);
                return of(null);
              })
            )
          )
        )
      )
    );
  }
}
