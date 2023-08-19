import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  selectAdding,
  selectLoading,
  selectError,
  selectRecipeToolsByRecipeID,
} from 'src/app/recipes/state/recipe-tool/recipe-tool-selectors';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  combineLatest,
  concatMap,
  filter,
  from,
  map,
  take,
} from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { RecipeToolActions } from 'src/app/recipes/state/recipe-tool/recipe-tool-actions';
import { AddRecipeToolModalComponent } from '../add-recipe-tool-modal/add-recipe-tool-modal.component';
import { selectTools } from 'src/app/kitchen/feature/tools/state/tool-selectors';
import { DeleteRequestConfirmationModalComponent } from 'src/app/shared/ui/delete-request-confirmation/delete-request-confirmation-modal.component';
import { DeleteRequestErrorModalComponent } from 'src/app/shared/ui/delete-request-error/delete-request-error-modal.component';
import { DeleteRecipeToolModalComponent } from '../delete-recipe-tool-modal/delete-recipe-tool-modal.component';

@Component({
  selector: 'dl-recipe-tools-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './recipe-tools-modal.component.html',
})
export class RecipeToolsModalComponent {
  recipe;
  recipeTools$!: Observable<any[]>;
  tools$!: Observable<any[]>;
  toolsToAdd: any[] = [];
  private toolsToAddSubject = new BehaviorSubject<any[]>([]);
  displayedTools$!: Observable<any[]>;
  isAdding$: Observable<boolean>;
  isLoading$: Observable<boolean>;
  private addingSubscription!: Subscription;
  private recipeToolsSubscription: Subscription = new Subscription();
  submitMessage = 'No tools needed';

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<RecipeToolsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store
  ) {
    this.recipe = this.data.recipe;
    this.isAdding$ = this.store.select(selectAdding);
    this.isLoading$ = this.store.select(selectLoading);
    this.recipeTools$ = this.store.select(
      selectRecipeToolsByRecipeID(this.recipe.recipeID)
    );

    this.displayedTools$ = combineLatest([
      this.store.select(selectRecipeToolsByRecipeID(this.recipe.recipeID)),
      this.store.select(selectTools),
      this.toolsToAddSubject.asObservable(),
    ]).pipe(
      map(([recipeTools, tools, toolsToAdd]) => {
        const enrichedRecipeTools = recipeTools.map((recipeTool) => ({
          ...recipeTool,
          name: tools.find((tool: any) => tool.toolID === recipeTool.toolID)
            ?.name,
        }));
        return [...enrichedRecipeTools, ...toolsToAdd];
      })
    );
  }

  ngOnInit(): void {
    this.tools$ = this.store.select(selectTools);
  }

  onSubmit() {
    if (this.toolsToAdd.length === 0) {
      this.store.dispatch(
        RecipeToolActions.addRecipeTool({
          recipeTool: {
            recipeID: this.recipe.recipeID,
            toolID: -1,
            quantity: -1,
          },
        })
      );

      //wait for the adding to complete before closing the modal
      this.addingSubscription = this.store
        .select(selectAdding)
        .subscribe((adding: boolean) => {
          if (!adding) {
            this.store.select(selectError).subscribe((error) => {
              if (error) {
                this.dialogRef.close(error);
              } else {
                this.dialogRef.close('success');
              }
            });
          }
        });
    } else {
      // Submit all added tools. Wait for each to process before calling next.
      from(this.toolsToAdd)
        .pipe(
          concatMap((tool) => {
            this.store.dispatch(
              RecipeToolActions.addRecipeTool({
                recipeTool: tool,
              })
            );

            return this.store.select(selectAdding).pipe(
              filter((adding) => !adding),
              take(1),
              concatMap(() => this.store.select(selectError).pipe(take(1)))
            );
          })
        )
        .subscribe((error) => {
          if (!error) {
            this.dialogRef.close('success');
          } else {
            this.dialogRef.close();
          }
        });
    }
  }

  onDeleteClick(toolID: number, recipeToolID: number) {
    if (recipeToolID) {
      const dialogRef = this.dialog.open(DeleteRecipeToolModalComponent, {
        data: {
          recipeToolID,
          toolID,
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result === 'success') {
          this.dialog.open(DeleteRequestConfirmationModalComponent, {
            data: {
              deleteSuccessMessage: `Tool successfully removed from recipe!`,
            },
          });
        } else if (result) {
          this.dialog.open(DeleteRequestErrorModalComponent, {
            data: {
              error: result,
              deleteErrorMessage: `Error: ${result}`,
            },
          });
        }
      });
    } else {
      this.toolsToAdd = this.toolsToAdd.filter(
        (tool) => tool.toolID !== toolID
      );
      this.toolsToAddSubject.next(this.toolsToAdd);
      if (this.toolsToAdd.length === 0) {
        this.submitMessage = 'No tools needed';
      }
    }
  }

  onAddClick() {
    const toolsToExclude: any[] = [];

    this.store
      .select(selectRecipeToolsByRecipeID(this.recipe.recipeID))
      .pipe(take(1))
      .subscribe((recipeTools) => {
        recipeTools.map((recipeTool) => {
          toolsToExclude.push(recipeTool.toolID);
        });

        this.toolsToAdd.forEach((tool) => {
          toolsToExclude.push(tool.toolID);
        });

        const dialogRef = this.dialog.open(AddRecipeToolModalComponent, {
          data: {
            toolsToExclude,
          },
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result?.toolID) {
            this.tools$
              .pipe(
                map(
                  (tools) =>
                    tools.find((tool) => tool.toolID === result.toolID)?.name
                ),
                take(1)
              )
              .subscribe((toolName) => {
                const addedRecipeTool: any = {
                  recipeID: this.recipe.recipeID,
                  toolID: result.toolID,
                  quantity: result.quantity,
                  name: toolName,
                  toAdd: true,
                };

                this.toolsToAdd.push(addedRecipeTool);
                this.submitMessage = 'Submit Additions';
                this.toolsToAddSubject.next(this.toolsToAdd);
              });
          }
        });
      });
  }

  onCancel() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    if (this.addingSubscription) {
      this.addingSubscription.unsubscribe();
    }
    if (this.recipeToolsSubscription) {
      this.recipeToolsSubscription.unsubscribe();
    }
    if (this.toolsToAddSubject) {
      this.toolsToAddSubject.unsubscribe();
    }
  }
}
