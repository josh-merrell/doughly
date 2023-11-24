import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, withLatestFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Store } from '@ngrx/store';
import { IDService } from 'src/app/shared/utils/ID';

import { Profile } from '../state/profile-state';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private API_URL = `${environment.BACKEND}/profiles`;

  constructor(
    private http: HttpClient,
    private store: Store,
    private idService: IDService
  ) {}

  getProfile(): Observable<Profile> {
    return this.http.get<Profile>(`${this.API_URL}/`);
  }

  getFriends(): Observable<Profile[]> {
    return this.http.get<Profile[]>(
      `${this.API_URL}/friends?friendStatus=confirmed`
    );
  }

  getFriendRequests(): Observable<Profile[]> {
    return this.http.get<Profile[]>(
      `${this.API_URL}/friends?friendStatus=receivedRequest`
    );
  }

  getFriendRequestsSent(): Observable<Profile[]> {
    return this.http.get<Profile[]>(
      `${this.API_URL}/friends?friendStatus=requesting`
    );
  }

  getFriendByID(friendUserID: string): Observable<Profile> {
    return this.http.get<Profile>(`${this.API_URL}/friends/${friendUserID}`);
  }

  getFollowers(): Observable<Profile[]> {
    return this.http.get<Profile[]>(`${this.API_URL}/followers`);
  }

  getFollowerByID(followerUserID: string): Observable<Profile> {
    return this.http.get<Profile>(
      `${this.API_URL}/followers/${followerUserID}`
    );
  }

  searchProfiles(searchQuery: string): Observable<Profile[]> {
    return this.http.get<Profile[]>(`${this.API_URL}/search?searchQuery=${searchQuery}`);
  }
}
