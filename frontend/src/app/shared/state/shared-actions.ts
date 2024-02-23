import { createAction, props } from '@ngrx/store';

export const setCurrentUrl = createAction('[App] Set Current Url', props<{ url: string }>());
