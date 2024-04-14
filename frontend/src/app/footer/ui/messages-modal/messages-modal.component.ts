import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { UnitService } from 'src/app/shared/utils/unitService';

@Component({
  selector: 'dl-messages-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './messages-modal.component.html',
})
export class MessagesModalComponent {
  constructor(
    private store: Store,
    public dialog: MatDialog,
    private unitService: UnitService
  ) {}
}
