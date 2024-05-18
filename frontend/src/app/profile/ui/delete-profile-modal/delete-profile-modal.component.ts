import { CommonModule } from '@angular/common';
import { Component, Inject, WritableSignal, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import {
  selectDeleting,
  selectError,
  selectProfile,
} from '../../state/profile-selectors';
import { ProfileActions } from '../../state/profile-actions';
import { filter, take } from 'rxjs';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { PushNotifications } from '@capacitor/push-notifications';
import { Router } from '@angular/router';
import { ModalService } from 'src/app/shared/utils/modalService';

@Component({
  selector: 'dl-delete-profile-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './delete-profile-modal.component.html',
})
export class DeleteProfileModalComponent {
  isDeleting: boolean = false;
  public message1: string =
    'Are you sure you want to delete your account and all related data? You will be logged out and your account will be permanently deleted.';
  public message2: string =
    'Final confirmation: Are you absolutely sure you wish to delete your account and all related data?';
  public strong1: string = 'This cannot be undone!';
  public isFinal: WritableSignal<boolean> = signal(false);

  constructor(
    public dialogRef: MatDialogRef<DeleteProfileModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    public dialog: MatDialog,
    private authService: AuthService,
    private router: Router,
    private modalService: ModalService
  ) {
    this.store.select(selectProfile).subscribe((profile) => {});
  }

  ngOnInit(): void {
    console.log(`USER ID: `, this.data.userID);
    console.log(`IS FINAL: `, this.data.isFinal);
    if (this.data.isFinal === true) {
      this.isFinal.set(true);
    }
  }

  onSubmit(): void {
    if (!this.isFinal()) {
      this.dialogRef.close('confirm');
      return;
    } else {
      this.isDeleting = true;
      this.store.dispatch(
        ProfileActions.deleteProfile({
          userID: this.data.userID,
        })
      );
      this.store
        .select(selectDeleting)
        .pipe(filter((deleting) => !deleting))
        .subscribe(() => {
          this.store
            .select(selectError)
            .pipe(take(1))
            .subscribe((error) => {
              if (error) {
                console.error(
                  `Profile deletion failed: ${error.message}, CODE: ${error.statusCode}`
                );
                this.modalService.open(
                  ErrorModalComponent,
                  {
                    maxWidth: '380px',
                    data: {
                      errorMessage: error.message,
                    },
                  },
                  2,
                  true
                );
              } else {
                PushNotifications.unregister;
                // wait for logout to process
                setTimeout(() => {
                  // get current profile from authService
                  this.authService.deleteProfile();
                  this.router.navigate(['/login']);
                  this.dialogRef.close('success');
                }, 2000);
              }
            });
        });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
