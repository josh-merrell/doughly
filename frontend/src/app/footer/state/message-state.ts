import { NumberValueAccessor } from '@angular/forms';

export interface MessageState {
  messages: Message[];
  loading: boolean;
  error: MessageError | null;
}

export interface MessageError {
  errorType: string;
  message: string;
  statusCode?: number;
  rawError?: any;
}

export interface Message {
  type: string;
  messageData: MessageData;
  date: Date;
  displayDate?: string;
}

export interface MessageData {
  title: string;
  message: string;
  status: string;
  data:
    | IngredientStockExpiredData
    | IngredientOutOfStockData
    | NewFollowerData
    | NewFriendData
    | NewFriendRequestData;
}

export interface IngredientStockExpiredData {
  ingredientStockID: number;
  ingredientID: number;
  ingredientName: string;
  measurement: number;
  measurementUnit: string;
}

export interface IngredientOutOfStockData {
  ingredientID: number;
  ingredientName: string;
}

export interface NewFollowerData {
  followshipID: number;
  followerNameFirst: string;
  followerNameLast: string;
  followerUserID: number;
}

export interface NewFriendData {
  friendshipID: number;
  friendNameFirst: string;
  friendNameLast: string;
  friendUserID: number;
}

export interface NewFriendRequestData {
  friendshipID: number;
  requesterNameFirst: string;
  requesterNameLast: string;
  requesterUserID: number;
}
