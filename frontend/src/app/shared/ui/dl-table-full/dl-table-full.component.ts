import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dl-table-full',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dl-table-full.component.html',
})
export class TableFullComponent {

  @Input() title!: string;
  @Input() heading_phrase!: string;
  @Input() button_title!: string;
  @Input() columns!: any[];
  @Input() rows!: any[];

}
