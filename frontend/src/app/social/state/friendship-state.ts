export interface Friendship {
  friendshipID: number;
  status: string;
  friend: string;
  version?: number;
  userID?: number;
}

export interface FriendshipState {
  friendships: Friendship[];
  loading: boolean;
  adding: boolean;
  updating: boolean;
  deleting: boolean;
  error: FriendshipError | null;
}

export interface FriendshipError {
  errorType: string;
  message: string;
  statusCode?: number;
  rawError?: any;
}