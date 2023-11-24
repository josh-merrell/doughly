import { Component, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectLoading, selectSearchResults } from 'src/app/profile/state/profile-selectors';
import { ProfileActions } from 'src/app/profile/state/profile-actions';
import { ProfileCardComponent } from '../profile-card/profile-card.component';

@Component({
  selector: 'dl-add-friend-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, ProfileCardComponent],
  templateUrl: './add-friend-modal.component.html',
})
export class AddFriendModalComponent {
  public searchFilter: WritableSignal<string> = signal('');
  public searchedQuery: WritableSignal<string> = signal('');
  public selectedCard: WritableSignal<Number | null> = signal(null);
  public searchResults: WritableSignal<any[]> = signal([]);
  public isLoading: WritableSignal<boolean> = signal(false);

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.store.select(selectLoading).subscribe((loading) => {
      this.isLoading.set(loading);
    });

    this.store.select(selectSearchResults).subscribe((searchResults) => {
      this.searchResults.set(searchResults);
    });
  }

  onSearch(): void {
    this.store.dispatch(
      ProfileActions.searchProfiles({ searchQuery: this.searchFilter() })
    );
    this.searchedQuery.set(this.searchFilter());
  }

  onAddFriend(): void {
    console.log(`Add friend clicked`);
  }

  onCardClick(index: number): void {
    this.selectedCard.set(index);
  }

  onFollow(): void {
    console.log(`Follow clicked`);
  }
}
