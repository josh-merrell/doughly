import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, withLatestFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Store } from '@ngrx/store';
import { IDService } from 'src/app/shared/utils/ID';

import { Friendship } from '../state/friendship-state';
import { selectFriendships } from '../state/friendship-selectors';

@Injectable({
  providedIn: 'root',
})
export class SocialService {
  private API_URL = `${environment.BACKEND}/persons`;

  friendshipRows$: Observable<Friendship[]> = this.store
    .select(selectFriendships)
    .pipe(
      map((friendships: Friendship[]) => {
        return friendships.map((friendship: Friendship) => {
          return {
            friendshipID: friendship.friendshipID,
            status: friendship.status,
            friend: friendship.friend,
          };
        });
      })
    );

  constructor(
    private http: HttpClient,
    private store: Store,
    private idService: IDService
  ) {}

  getAllFriendships(): Observable<Friendship[]> {
    return this.http.get<Friendship[]>(`${this.API_URL}/friendships`);
  }

  getFriendshipByID(friendshipID: number): Observable<Friendship> {
    return this.http.get<Friendship>(
      `${this.API_URL}/friendships/${friendshipID}`
    );
  }

  addFriendship(friendship: Friendship): Observable<Friendship> {
    const IDtype = this.idService.getIDtype('friendship');
    const body = {
      IDtype,
      friend: friendship.friend, //personID of users requested friend
    };
    return this.http.post<Friendship>(`${this.API_URL}/friendships`, body);
  }

  updateFriendship(friendship: Friendship): Observable<Friendship> {
    return this.http.put<Friendship>(
      `${this.API_URL}/friendships/${friendship.friendshipID}`,
      friendship
    );
  }

  deleteFriendship(friendshipID: number): Observable<Friendship> {
    return this.http.delete<Friendship>(
      `${this.API_URL}/friendships/${friendshipID}`
    );
  }

  getTotalUserFriendships(): number {
    //get all friendships, then filter by status = 'accepted'
    let totalFriendships = 0;
    this.store.select(selectFriendships).subscribe((friendships) => {
      const userFriendships = friendships.filter(
        (friendship: Friendship) => friendship.status === 'accepted'
      );
      totalFriendships = userFriendships.length;
    });
    return totalFriendships;
  }
}
