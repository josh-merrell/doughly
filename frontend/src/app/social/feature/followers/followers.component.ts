import { Component, WritableSignal, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Profile } from 'src/app/profile/state/profile-state';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { ProfileActions } from 'src/app/profile/state/profile-actions';
import { selectFollowers } from 'src/app/profile/state/profile-selectors';
import { selectFollowing } from 'src/app/profile/state/profile-selectors';
import { FriendModalComponent } from '../friends/ui/friend-modal/friend-modal.component';
import { FriendCardComponent } from '../friends/ui/friend-card/friend-card.component';



@Component({
  selector: 'dl-followers',
  standalone: true,
  imports: [CommonModule, FriendCardComponent],
  templateUrl: './followers.component.html',
})
export class FollowersComponent {
  public searchFilter: WritableSignal<string> = signal('');
  public followers: WritableSignal<Profile[]> = signal([]);
  public following: WritableSignal<Profile[]> = signal([]);
  public view: WritableSignal<string> = signal('followers');
  public filteredPersons = computed(() => {
    const searchFilter = this.searchFilter();
    const persons =
      this.view() === 'followers' ? this.followers() : this.following();
    if (searchFilter) {
      return persons.filter((person) => {
        return (
          person.nameFirst.toLowerCase().includes(searchFilter.toLowerCase()) ||
          person.nameLast.toLowerCase().includes(searchFilter.toLowerCase()) ||
          person.username.toLowerCase().includes(searchFilter.toLowerCase())
        );
      });
    } else {
      return persons;
    }
  });

  constructor(private store: Store, public dialog: MatDialog) {}

  ngOnInit(): void {
    this.store.dispatch(ProfileActions.loadProfile());
    this.store.dispatch(ProfileActions.loadFollowers());
    this.store.dispatch(ProfileActions.loadFollowing());

    this.store.select(selectFollowers).subscribe((followers) => {
      this.followers.set(followers);
    });
    this.store.select(selectFollowing).subscribe((following) => {
      this.following.set(following);
    });
  }

  updateSearchFilter(searchFilter: string): void {
    this.searchFilter.set(searchFilter);
  }

  onPersonClick(person: Profile): void {
    this.dialog.open(FriendModalComponent, {
      data: person,
      width: '80%',
      maxWidth: '540px',
    });
  }
}
