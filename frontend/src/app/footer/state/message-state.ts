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
}

export interface MessageData {
  title: string;
  message: string;
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
  ingredientStockID: number;
  ingredientID: number;
  ingredientName: string;
}

export interface NewFollowerData {
  followershipID: number;
  followerNameFirst: string;
  followerNameLast: string;
}

export interface NewFriendData {
  friendshipID: number;
  friendNameFirst: string;
  friendNameLast: string;
}

export interface NewFriendRequestData {
  friendshipRequestID: number;
  requesterNameFirst: string;
  requesterNameLast: string;
}
