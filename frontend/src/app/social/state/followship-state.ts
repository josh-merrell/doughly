export interface Followship {
  followshipID: number;
  userID: string;
  following: string;
}

export interface FollowshipState {
  followships: Followship[];
  followers: Followship[];
  loading: boolean;
  adding: boolean;
  updating: boolean;
  deleting: boolean;
  error: FollowshipError | null;
}

export interface FollowshipError {
  errorType: string;
  message: string;
  statusCode?: number;
  rawError?: any;
}