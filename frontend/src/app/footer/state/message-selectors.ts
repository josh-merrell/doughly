import { createSelector } from '@ngrx/store';
import { Message } from './message-state';

export const selectMessages = (state: any) => state.message.messages;

export const selectMessagesByType = (type: string) =>
  createSelector(selectMessages, (messages) => {
    return messages.filter((message: Message) => message.type === type);
  });

export const selectLoading = (state: any) => state.message.loading;

export const selectError = (state: any) => state.message.error;
