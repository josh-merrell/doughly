import { Injectable, WritableSignal, signal } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from 'src/environments/environment';
import { selectProfile } from 'src/app/profile/state/profile-selectors';
import { Store } from "@ngrx/store";
import { Profile } from "src/app/profile/state/profile-state";

@Injectable({ providedIn: 'root' })
export class RecipeProgressService {
  private profile: WritableSignal<Profile> = signal({} as Profile);
  constructor(public store: Store) {
    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
    });
  }
  private API_URL = `${environment.BACKEND}/recipe-progress`;
  private eventSource!: EventSource;

  public startListening(): Observable<string> {
    if (this.profile().userID === undefined) {
      throw new Error('No user ID found');
    }
    return new Observable((observer) => {
      this.eventSource = new EventSource(`${this.API_URL}?userID=${this.profile().userID}`);

      this.eventSource.onmessage = (event) => {
        observer.next(event.data);
      };

      this.eventSource.onerror = (error) => {
        observer.error(error);
      };
    });
  }

  public stopListening(): void {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}
