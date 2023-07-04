import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';


@Component({
  selector: 'dl-update-request-error-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './update-request-error-modal.component.html'
})
export class UpdateRequestErrorModalComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: { error: any }) {
      console.log(`IN UPDATE REQUEST ERROR COMPONENT. ERROR RECEIVED: ${data.error}`)
   }
}
