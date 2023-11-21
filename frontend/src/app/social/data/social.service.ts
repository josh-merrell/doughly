import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, withLatestFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Store } from '@ngrx/store';
import { IDService } from 'src/app/shared/utils/ID';

import { Friendship } from '../state/friendship-state';
import { selectFriendships } from '../state/friendship-selectors';
import { Followship } from '../state/followship-state';
import { selectFollowships } from '../state/followship-selectors';

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
    followshipRows$: Observable<Followship[]> = this.store
    .select(selectFollowships)
    .pipe(
      map((followships: Followship[]) => {
        return followships.map((followship: Followship) => {
          return {
            followshipID: followship.followshipID,
            following: followship.following,
            userID: followship.userID,
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

  getAllFollowships(): Observable<Followship[]> {
    return this.http.get<Followship[]>(`${this.API_URL}/followships`);
  }

  getAllFollowers(): Observable<Followship[]> {
    return this.http.get<Followship[]>(`${this.API_URL}/followships/followers`);
  }

  getFriendshipByID(friendshipID: number): Observable<Friendship> {
    return this.http.get<Friendship>(
      `${this.API_URL}/friendships/${friendshipID}`
    );
  }

  getFollowshipByID(followshipID: number): Observable<Followship> {
    return this.http.get<Followship>(
      `${this.API_URL}/followships/${followshipID}`
    );
  }

  addFriendship(friendship: Friendship): Observable<Friendship> {
    const IDtype = this.idService.getIDtype('friendship');
    const body = {
      IDtype,
      friend: friendship.friend, //user_id of users requested friend
    };
    return this.http.post<Friendship>(`${this.API_URL}/friendships`, body);
  }

  addFollowship(followship: Followship): Observable<Followship> {
    const IDtype = this.idService.getIDtype('followship');
    const body = {
      IDtype,
      following: followship.following, //user_id of they who user is following
    };
    return this.http.post<Followship>(`${this.API_URL}/followships`, body);
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

  deleteFollowship(followshipID: number): Observable<Followship> {
    return this.http.delete<Followship>(
      `${this.API_URL}/followships/${followshipID}`
    );
  }

  getTotalUserFriendships(): number {
    //get all friendships, then filter by status = 'confirmed'
    let totalFriendships = 0;
    this.store.select(selectFriendships).subscribe((friendships) => {
      const userFriendships = friendships.filter(
        (friendship: Friendship) => friendship.status === 'confirmed'
      );
      totalFriendships = userFriendships.length;
    });
    return totalFriendships;
  }
}
