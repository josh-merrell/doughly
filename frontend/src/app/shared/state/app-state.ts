import { SharedState } from './shared-state';
import { IngredientState } from '../../ingredients/state/ingredient-state';


export interface AppState {
  shared: SharedState;
  ingredient: IngredientState;
}