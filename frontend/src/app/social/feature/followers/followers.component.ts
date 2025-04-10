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
import { ModalService } from 'src/app/shared/utils/modalService';

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
  public view: WritableSignal<string> = signal('following');
  public filteredPersons = computed(() => {
    const searchFilter = this.searchFilter();
    const persons =
      this.view() === 'followers' ? this.followers() : this.following();

    // Filter out entries where 'person.nameFirst' or 'person.nameLast' are empty
    const validPersons = persons.filter(
      (person) => person.nameFirst && person.nameLast
    );

    if (searchFilter) {
      return validPersons.filter((person) => {
        return (
          person.nameFirst.toLowerCase().includes(searchFilter.toLowerCase()) ||
          person.nameLast.toLowerCase().includes(searchFilter.toLowerCase()) ||
          person.username.toLowerCase().includes(searchFilter.toLowerCase())
        );
      });
    } else {
      return validPersons;
    }
  });

  constructor(
    private store: Store,
    public dialog: MatDialog,
    public modalService: ModalService
  ) {}

  ngOnInit(): void {
    // this.store.dispatch(ProfileActions.loadProfile({}));
    // this.store.dispatch(ProfileActions.loadFollowers());
    // this.store.dispatch(ProfileActions.loadFollowing());

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
    this.modalService.open(
      FriendModalComponent,
      {
        data: person,
        width: '80%',
        maxWidth: '540px',
      },
      1,
      false,
      'FriendModalComponent'
    );
  }
}
