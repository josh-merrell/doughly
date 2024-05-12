import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { StringsService } from 'src/app/shared/utils/strings';

@Component({
  selector: 'dl-promp-upgrade-modal',
  standalone: true,
  imports: [],
  templateUrl: './promp-upgrade-modal.component.html',
})
export class PrompUpgradeModalComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { titleMessage: string, promptMessage: string, buttonMessage: string},
    public dialogRef: MatDialogRef<PrompUpgradeModalComponent>,
    public stringsService: StringsService
  ) {}

  onRouteToUpgrade() {
    this.dialogRef.close('routeToUpgrade')
  }
}
