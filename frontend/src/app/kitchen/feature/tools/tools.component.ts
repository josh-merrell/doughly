import { Component, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableFullComponent } from 'src/app/shared/ui/dl-table-full/dl-table-full.component';
import { ToolService } from './data/tool.service';
import { FilterTypeEnum, SortEnum, SortRotateStateEnum, TableFullColumn } from 'src/app/shared/state/shared-state';
import { Observable } from 'rxjs';
import { Tool } from './state/tool-state';
import { AddToolModalComponent } from './ui/add-tool-modal/add-tool-modal.component';
import { EditToolModalComponent } from './ui/edit-tool-modal/edit-tool-modal.component';
import { DeleteToolModalComponent } from './ui/delete-tool-modal/delete-tool-modal.component';

@Component({
  selector: 'dl-tools',
  standalone: true,
  imports: [CommonModule, TableFullComponent],
  templateUrl: './tools.component.html',
})
export class ToolsComponent {
  addModalComponent: Type<any> = AddToolModalComponent;
  editModalComponent: Type<any> = EditToolModalComponent;
  deleteModalComponent: Type<any> = DeleteToolModalComponent;

  constructor(private toolService: ToolService) {}

  title = 'Tools';
  headingPhrase = 'Tools turn Ingredients into joy.';
  IDKey = 'toolID';
  searchPlaceholder = 'Search by Tool name...';
  searchSubject = 'name';
  addButtonTitle = 'Add Tool';
  addSuccessMessage = 'Added Tool with ID:';
  addFailureMessage = 'Failed to add Tool. Try again later.';
  editSuccessMessage = 'Updated Tool with ID:';
  editFailureMessage = 'Failed to update Tool. Try again later.';
  deleteSuccessMessage = 'Deleted Tool with ID:';
  deleteFailureMessage = 'Failed to delete Tool. Try again later.';
  columns: TableFullColumn[] = [
    {
      name: 'ID',
      prop: 'toolID',
      cssClass: 'w-dl-3',
      sort: SortEnum.numerical,
      sortRotateState: SortRotateStateEnum.default,
      sortOrderState: null,
      filterType: FilterTypeEnum.numRange,
    },
    {
      name: 'Tool',
      prop: 'name',
      cssClass: 'w-dl-5',
      sort: SortEnum.alphabetical,
      sortRotateState: SortRotateStateEnum.default,
      sortOrderState: null,
      filterType: FilterTypeEnum.search,
    },
    {
      name: 'Brand',
      prop: 'brand',
      cssClass: 'w-dl-5',
      sort: SortEnum.alphabetical,
      sortRotateState: SortRotateStateEnum.default,
      sortOrderState: null,
      filterType: FilterTypeEnum.search,
    },
  ];

  rows$: Observable<Tool[]> = this.toolService.rows$;
}
