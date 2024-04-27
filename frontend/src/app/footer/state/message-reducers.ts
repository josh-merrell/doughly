import { createReducer, on } from '@ngrx/store';
import { MessageActions } from './message-actions';
import { MessageState } from './message-state';

export const initialState: MessageState = {
  messages: [],
  loading: false,
  error: null,
};

export const MessageReducer = createReducer(
  initialState,
  on(MessageActions.loadMessages, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(MessageActions.loadMessagesSuccess, (state, { messages }) => ({
    ...state,
    messages,
    loading: false,
  })),
  on(MessageActions.loadMessagesFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(MessageActions.acknowledgeMessage, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(MessageActions.acknowledgeMessageSuccess, (state) => ({
    ...state,
    loading: false,
  })),
  on(MessageActions.acknowledgeMessageFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(MessageActions.deleteMessage, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(MessageActions.deleteMessageSuccess, (state) => ({
    ...state,
    loading: false,
  })),

);