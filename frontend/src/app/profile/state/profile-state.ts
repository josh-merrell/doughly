import { Recipe } from 'src/app/recipes/state/recipe/recipe-state';
import { TimelineEvent } from 'src/app/social/feature/timeline/state/timeline-state';

export interface Profile {
  userID: string;
  nameFirst: string;
  nameLast: string;
  username: string;
  email: string;
  imageURL: string;
  joinDate: string;
  city: string;
  state: string;
  friendCount: number;
  followerCount: number;
  recipes: Recipe[];
  timelineEvents: TimelineEvent[];
  friendshipStatus?: string;
  onboardingState: number;

  // settings
  checkIngredientStock: boolean;
  notifyOnLowStock: string;
  notifyOnNoStock: string;
  notifyUpcomingStockExpiry: string;
  notifyExpiredStock: string;
  notifyFriendCreateRecipe: string;
  notifyFolloweeCreateRecipe: string;
  notifyFriendRequest: string;
  notifyNewFollower: string;
  darkMode: boolean;

  // permissions
  isPremium: boolean;
  permRecipeSubscribeUnlimited: boolean;
  permRecipeCreateUnlimited: boolean;
  permDataBackupDaily6MonthRetention: boolean;
  permAITokenCount: number;
  permAITokenLastRefreshDate: string;
}

export interface ProfileState {
  profile: Profile | null;
  friends: Profile[];
  followers: Profile[];
  following: Profile[];
  searchResults: Profile[];
  friendRequestProfiles: Profile[];
  friendRequestSentProfiles: Profile[];
  loading: boolean;
  deleting: boolean;
  adding: boolean;
  updating: boolean;
  error: ProfileError | null;
}

export interface ProfileError {
  errorType: string;
  message: string;
  statusCode?: number;
  rawError?: any;
}
