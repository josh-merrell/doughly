import { SharedState } from './shared-state';
import { IngredientState } from '../../ingredients/state/ingredient-state';
import { KitchenState } from '../../kitchen/state/kitchen-state';


export interface AppState {
  shared: SharedState;
  kitchen: KitchenState;
  ingredient: IngredientState;
}