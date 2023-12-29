import {
  Component,
  Inject,
  WritableSignal,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Friendship } from 'src/app/social/state/friendship-state';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Store } from '@ngrx/store';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { selectRecipes } from 'src/app/recipes/state/recipe/recipe-selectors';
import { Profile } from 'src/app/profile/state/profile-state';
import { RecipeCardComponent } from 'src/app/recipes/feature/recipes-page/ui/recipe/recipe-card/recipe-card.component';
import {
  selectDeleting,
  selectFriendshipByFriendID,
} from 'src/app/social/state/friendship-selectors';
import { selectFollowshipByFollowingID } from 'src/app/social/state/followship-selectors';
import { FriendshipActions } from 'src/app/social/state/friendship-actions';
import { FollowshipActions } from 'src/app/social/state/followship-actions';
import { Followship } from 'src/app/social/state/followship-state';
import { Router } from '@angular/router';

@Component({
  selector: 'dl-friend-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, RecipeCardComponent],
  templateUrl: './friend-modal.component.html',
})
export class FriendModalComponent {
  public friend!: Profile;
  public initials: string = '';
  public view: string = 'recipes';
  public friendship: WritableSignal<Friendship | null> = signal(null);
  public followship: WritableSignal<Followship | null> = signal(null);
  public buttonTexts: WritableSignal<any> = signal({});
  public isDeleting: WritableSignal<boolean> = signal(false);
  public recipesFromMe: WritableSignal<any[]> = signal([]);
  public otherRecipes: WritableSignal<any[]> = signal([]);
  private myRecipes: WritableSignal<any[]> = signal([]);

  constructor(
    private store: Store,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<FriendModalComponent>,
    public router: Router
  ) {
    this.buttonTexts.set({ friendButton: '', followButton: '' });
    
    effect(() => {
      const myRecipes = this.myRecipes();
      const friendRecipes = this.friend.recipes;
      const recipesFromMe: any[] = [];
      const otherRecipes: any[] = [];
      for (let fr of friendRecipes) {
        if (fr.subscription) {
          //if myRecipes contains recipe where recipeID matches 'fr.subscription.sourceRecipeID', push to recipesFromMe
          const recipeFromMe = myRecipes.find(
            (r) => r.recipeID === fr.subscription?.sourceRecipeID
          );
          if (recipeFromMe) {
            recipesFromMe.push(fr);
          } else {
            //else push to otherRecipes
            otherRecipes.push(fr);
          }
        } else {
          //else push to otherRecipes
          otherRecipes.push(fr);
        }
      }
      this.recipesFromMe.set(recipesFromMe);
      this.otherRecipes.set(otherRecipes);
    }, { allowSignalWrites: true })
  }

  ngOnInit(): void {
    this.store.select(selectRecipes).subscribe((recipes) => {
      this.myRecipes.set(recipes);
    });
    this.store.select(selectDeleting).subscribe((deleting) => {
      this.isDeleting.set(deleting);
    });

    this.friend = this.data;
    console.log(`FRIEND RECIPES: `, this.friend.recipes)
    this.initials = this.friend.nameFirst[0] + this.friend.nameLast[0];

    this.store
      .select(selectFriendshipByFriendID(this.friend.userID))
      .subscribe((friendship) => {
        this.friendship.set(friendship);
        if (friendship) {
          const updatedButtonTexts = { ...this.buttonTexts() };
          if (friendship.status === 'confirmed') {
            updatedButtonTexts.friendButton = 'Unfriend';
          } else if (friendship.status === 'requesting') {
            updatedButtonTexts.friendButton = 'Cancel Request';
          } else if (friendship.status === 'receivedRequest') {
            updatedButtonTexts.friendButton = 'Accept Request';
          } else {
            updatedButtonTexts.friendButton = 'Add Friend';
          }
          this.buttonTexts.set(updatedButtonTexts);
        }
      });

    this.store
      .select(selectFollowshipByFollowingID(this.friend.userID))
      .subscribe((followship) => {
        this.followship.set(followship);
        const updatedButtonTexts = { ...this.buttonTexts() };
        if (followship) {
          updatedButtonTexts.followButton = 'Unfollow';
        } else {
          updatedButtonTexts.followButton = 'Follow';
        }
        this.buttonTexts.set(updatedButtonTexts);
      });
  }

  onFriendButtonClick(): void {
    switch (this.friendship()?.status) {
      case 'confirmed':
        this.store.dispatch(
          FriendshipActions.deleteFriendship({
            friendshipID: this.friendship()!.friendshipID,
          })
        );
        this.isDeleting.set(true);
        this.store.select(selectDeleting).subscribe((deleting) => {
          if (!deleting) {
            this.dialogRef.close();
          }
        });
        break;
      case 'receivedRequest':
        this.store.dispatch(
          FriendshipActions.editFriendship({
            friendshipID: this.friendship()!.friendshipID,
            newStatus: 'confirmed',
          })
        );
        break;
      case 'requesting':
        this.store.dispatch(
          FriendshipActions.deleteFriendship({
            friendshipID: this.friendship()!.friendshipID,
          })
        );
        this.isDeleting.set(true);
        this.store.select(selectDeleting).subscribe((deleting) => {
          if (!deleting) {
            this.dialogRef.close();
          }
        });
        break;
      default:
        console.log(`No friend to add!`);
        break;
    }
  }

  onFollowButtonClick(): void {
    if (this.followship()) {
      this.store.dispatch(
        FollowshipActions.deleteFollowship({
          followshipID: this.followship()!.followshipID,
        })
      );
    } else {
      this.store.dispatch(
        FollowshipActions.addFollowship({
          following: this.friend.userID,
        })
      );
    }
  }

  onRecipeCardClick(recipeID: number): void {
    this.router.navigate(['/recipe/public', recipeID]);
    this.dialogRef.close();
  }
}
