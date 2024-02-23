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
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { selectRecipes } from 'src/app/recipes/state/recipe/recipe-selectors';
import { Profile } from 'src/app/profile/state/profile-state';
import { RecipeCardComponent } from 'src/app/recipes/feature/recipes-page/ui/recipe/recipe-card/recipe-card.component';
import {
  selectDeleting as selectDeletingFriendship,
  selectError as selectErrorFriendship,
  selectFriendshipByFriendID,
  selectUpdating as selectUpdatingFriendship,
} from 'src/app/social/state/friendship-selectors';
import {
  selectFollowshipByFollowingID,
  selectDeleting as selectDeletingFollowship,
  selectAdding as selectAddingFollowship,
  selectError as selectErrorFollowship,
} from 'src/app/social/state/followship-selectors';
import { FriendshipActions } from 'src/app/social/state/friendship-actions';
import { FollowshipActions } from 'src/app/social/state/followship-actions';
import { Followship } from 'src/app/social/state/followship-state';
import { Router } from '@angular/router';
import { filter, take } from 'rxjs';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { TimelineComponent } from 'src/app/social/feature/timeline/timeline.component';
import { LogService } from 'src/app/shared/utils/logService';
import { Log } from 'src/app/shared/state/shared-state';

@Component({
  selector: 'dl-friend-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    RecipeCardComponent,
    TimelineComponent,
  ],
  templateUrl: './friend-modal.component.html',
})
export class FriendModalComponent {
  public isLoading: WritableSignal<boolean> = signal(false);
  public friend!: Profile;
  public displayDate: WritableSignal<string> = signal('');
  public initials: string = '';
  public view: string = 'recipes';
  public friendship: WritableSignal<Friendship | null> = signal(null);
  public followship: WritableSignal<Followship | null> = signal(null);
  public buttonTexts: WritableSignal<any> = signal({});
  public isDeleting: WritableSignal<boolean> = signal(false);
  public recipesFromMe: WritableSignal<any[]> = signal([]);
  public otherRecipes: WritableSignal<any[]> = signal([]);
  private myRecipes: WritableSignal<any[]> = signal([]);

  // For Timeline Child Component
  public logs: Log[] = [];
  private monthAgo!: string;

  constructor(
    private store: Store,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<FriendModalComponent>,
    public router: Router,
    public dialog: MatDialog,
    private logService: LogService
  ) {
    this.buttonTexts.set({ friendButton: '', followButton: '' });

    effect(
      () => {
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
        // sort by recipe title
        otherRecipes.sort((a, b) => {
          if (a.title < b.title) {
            return -1;
          } else if (a.title > b.title) {
            return 1;
          } else {
            return 0;
          }
        });
        this.recipesFromMe.set(recipesFromMe);
        this.otherRecipes.set(otherRecipes);
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    this.store.select(selectRecipes).subscribe((recipes) => {
      this.myRecipes.set(recipes);
    });
    this.store.select(selectDeletingFriendship).subscribe((deleting) => {
      this.isDeleting.set(deleting);
    });

    this.friend = this.data;
    const joinDate = new Date(this.friend.joinDate);
    const month = joinDate.toLocaleString('default', { month: 'short' });
    const year = joinDate.getFullYear();
    this.displayDate.set(`${month} ${year}`);

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
    this.collectUserLogs();
  }

  collectUserLogs() {
    let date = new Date();
    date.setDate(date.getDate() - 30);
    date.setUTCHours(0, 0, 0, 0);
    this.monthAgo = this.formatDateToUTCString(date);

    // Get logs for recent Recipe Creation
    this.logService
      .getRecipeLogs(
        this.friend.userID,
        'createRecipe',
        this.monthAgo,
        undefined
      )
      .subscribe((res) => {
        this.logs.push(...res);
      });
    // Get logs for recent Recipe Uses
    this.logService
      .getRecipeFeedbackLogs(
        this.friend.userID,
        undefined,
        undefined,
        undefined
      )
      .subscribe((res) => {
        this.logs.push(...res);
      });
  }

  onFriendButtonClick(): void {
    if (!this.friendship()) {
      return;
    }
    switch (this.friendship()?.status) {
      case 'confirmed':
        this.isLoading.set(true);
        this.store.dispatch(
          FriendshipActions.deleteFriendship({
            friendshipID: this.friendship()!.friendshipID,
          })
        );
        this.store
          .select(selectDeletingFriendship)
          .pipe(
            filter((deleting) => !deleting),
            take(1)
          )
          .subscribe(() => {
            this.store
              .select(selectErrorFriendship)
              .pipe(take(1))
              .subscribe((error) => {
                if (error) {
                  console.error(
                    `Error deleting friendship: ${error.message}, CODE: ${error.statusCode}`
                  );
                  this.dialog.open(ErrorModalComponent, {
                    maxWidth: '380px',
                    data: {
                      errorMessage: error.message,
                      statusCode: error.statusCode,
                    },
                  });
                }
                this.isLoading.set(false);
              });
          });
        break;
      case 'receivedRequest':
        this.isLoading.set(true);
        this.store.dispatch(
          FriendshipActions.editFriendship({
            friendshipID: this.friendship()!.friendshipID,
            newStatus: 'confirmed',
          })
        );
        this.store
          .select(selectUpdatingFriendship)
          .pipe(
            filter((updating) => !updating),
            take(1)
          )
          .subscribe(() => {
            this.store
              .select(selectErrorFriendship)
              .pipe(take(1))
              .subscribe((error) => {
                if (error) {
                  console.error(
                    `Error accepting friendship: ${error.message}, CODE: ${error.statusCode}`
                  );
                  this.dialog.open(ErrorModalComponent, {
                    maxWidth: '380px',
                    data: {
                      errorMessage: error.message,
                      statusCode: error.statusCode,
                    },
                  });
                }
                this.isLoading.set(false);
              });
          });
        break;
      case 'requesting':
        this.isLoading.set(true);
        this.store.dispatch(
          FriendshipActions.deleteFriendship({
            friendshipID: this.friendship()!.friendshipID,
          })
        );
        this.store
          .select(selectDeletingFriendship)
          .pipe(
            filter((deleting) => !deleting),
            take(1)
          )
          .subscribe(() => {
            this.store
              .select(selectErrorFriendship)
              .pipe(take(1))
              .subscribe((error) => {
                if (error) {
                  console.error(
                    `Error canceling friendship request: ${error.message}, CODE: ${error.statusCode}`
                  );
                  this.dialog.open(ErrorModalComponent, {
                    maxWidth: '380px',
                    data: {
                      errorMessage: error.message,
                      statusCode: error.statusCode,
                    },
                  });
                }
                this.isLoading.set(false);
                this.dialogRef.close();
              });
          });
        break;
      default:
        console.log(`No friend to add!`);
        break;
    }
  }

  onFollowButtonClick(): void {
    if (this.followship()) {
      this.isLoading.set(true);
      this.store.dispatch(
        FollowshipActions.deleteFollowship({
          followshipID: this.followship()!.followshipID,
        })
      );
      this.store
        .select(selectDeletingFollowship)
        .pipe(
          filter((deleting) => !deleting),
          take(1)
        )
        .subscribe(() => {
          this.store
            .select(selectErrorFollowship)
            .pipe(take(1))
            .subscribe((error) => {
              if (error) {
                console.error(
                  `Error deleting followship: ${error.message}, CODE: ${error.statusCode}`
                );
                this.dialog.open(ErrorModalComponent, {
                  maxWidth: '380px',
                  data: {
                    errorMessage: error.message,
                    statusCode: error.statusCode,
                  },
                });
              }
              this.isLoading.set(false);
            });
        });
    } else {
      this.isLoading.set(true);
      this.store.dispatch(
        FollowshipActions.addFollowship({
          following: this.friend.userID,
        })
      );
      this.store
        .select(selectAddingFollowship)
        .pipe(
          filter((adding) => !adding),
          take(1)
        )
        .subscribe(() => {
          this.store
            .select(selectErrorFollowship)
            .pipe(take(1))
            .subscribe((error) => {
              if (error) {
                console.error(
                  `Error adding followship: ${error.message}, CODE: ${error.statusCode}`
                );
                this.dialog.open(ErrorModalComponent, {
                  maxWidth: '380px',
                  data: {
                    errorMessage: error.message,
                    statusCode: error.statusCode,
                  },
                });
              }
              this.isLoading.set(false);
            });
        });
    }
  }

  onRecipeCardClick(recipeID: number): void {
    this.router.navigate(['/recipe/public', recipeID]);
    this.dialogRef.close();
  }

  // ** UTILITIES ** //
  private formatDateToUTCString(date: Date): string {
    return (
      date.getUTCFullYear() +
      '-' +
      this.pad(date.getUTCMonth() + 1) +
      '-' +
      this.pad(date.getUTCDate()) +
      ' ' +
      this.pad(date.getUTCHours()) +
      ':' +
      this.pad(date.getUTCMinutes()) +
      ':' +
      this.pad(date.getUTCSeconds()) +
      '.' +
      date.getUTCMilliseconds() +
      '+00'
    );
  }

  private pad(number: number): string {
    if (number < 10) {
      return '0' + number;
    }
    return number.toString();
  }
}
