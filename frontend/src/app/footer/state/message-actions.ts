import { createAction, props } from '@ngrx/store';
import { Message } from './message-state';

const loadMessages = createAction('[Messages] Load');
const loadMessagesSuccess = createAction(
  '[Messages] Load Success',
  props<{ messages: Message[] }>()
);
const loadMessagesFailure = createAction(
  '[Messages] Load Failure',
  props<{ error: any }>()
);

const acknowledgeMessage = createAction(
  '[Messages] Acknowledge',
  props<{ message: Message }>()
);
const acknowledgeMessageSuccess = createAction(
  '[Messages] Acknowledge Success'
);
const acknowledgeMessageFailure = createAction(
  '[Messages] Acknowledge Failure',
  props<{ error: any }>()
);

const deleteMessage = createAction(
  '[Messages] Delete',
  props<{ message: Message }>()
);
const deleteMessageSuccess = createAction(
  '[Messages] Delete Success'
);
const deleteMessageFailure = createAction(
  '[Messages] Delete Failure',
  props<{ error: any }>()
);

export const MessageActions = {
  loadMessages,
  loadMessagesSuccess,
  loadMessagesFailure,
  acknowledgeMessage,
  acknowledgeMessageSuccess,
  acknowledgeMessageFailure,
  deleteMessage,
  deleteMessageSuccess,
  deleteMessageFailure,
};
