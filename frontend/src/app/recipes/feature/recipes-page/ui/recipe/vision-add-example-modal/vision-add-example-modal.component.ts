import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';

@Component({
  selector: 'dl-vision-add-example-modal',
  standalone: true,
  imports: [],
  templateUrl: './vision-add-example-modal.component.html',
})
export class VisionAddExampleModalComponent {
  constructor(
    public dialogRef: MatDialogRef<VisionAddExampleModalComponent>,
    public extraStuffService: ExtraStuffService
  ) {}

  onCancel() {
    this.dialogRef.close();
  }
}
