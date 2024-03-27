('use strict');
const { errorGen } = require('../../middleware/errorHandling');

module.exports = ({ db, dbPublic }) => {
  async function retrieveProfile(userID, friendStatus = 'confirmed') {
    // get all columns from dbPublic.profiles where userID = userID
    const { data: profile, error } = await dbPublic.from('profiles').select('*').eq('user_id', userID).single();
    if (error) {
      global.logger.error(`Error getting profile for userID ${userID}: ${error.message}`);
      throw errorGen(`Error getting profile for userID ${userID}: ${error.message}`, 400);
    }
    if (!profile) {
      global.logger.error(`No profile found for userID ${userID}`);
    }

    // get count of rows from db.friendships where userID = userID, deleted = false and status = 'confirmed'
    const { data: friendshipIDs, error: errorFriendCount } = await db.from('friendships').select('friendshipID').eq('userID', userID).eq('deleted', false).eq('status', friendStatus);
    if (errorFriendCount) {
      global.logger.error(`Error getting friend count for userID ${userID}: ${errorFriendCount.message}`);
      throw errorGen(`Error getting friend count for userID ${userID}: ${errorFriendCount.message}`, 400);
    }

    // get count of rows from db.followships where following = userID and deleted = false
    const { data: followerIDs, error: errorFollowerCount } = await db.from('followships').select('followshipID').eq('following', userID).eq('deleted', false);
    if (errorFollowerCount) {
      global.logger.error(`Error getting follower count for userID ${userID}: ${errorFollowerCount.message}`);
      throw errorGen(`Error getting follower count for userID ${userID}: ${errorFollowerCount.message}`, 400);
    }

    // get public recipes for this user. If the friendStatus is confirmed, get any recipes not equal to private
    const q = db.from('recipes').select('recipeID, title, servings, recipeCategoryID, type, lifespanDays, version, status, photoURL').eq('userID', userID).eq('status', 'published').eq('deleted', false);
    if (friendStatus === 'confirmed') {
      q.neq('type', 'private');
    } else {
      q.eq('type', 'public');
    }
    const { data: recipes, error: errorRecipes } = await q;
    if (errorRecipes) {
      global.logger.error(`Error getting recipes for userID ${userID}: ${errorRecipes.message}`);
      throw errorGen(`Error getting recipes for userID ${userID}: ${errorRecipes.message}`, 400);
    }

    // for each recipe, get the recipeCategoryName from the recipeCategoryID, then update the recipe object with recipeCategoryName
    const promises = recipes.map(async (recipe) => {
      const { data: recipeCategory, error: errorRecipeCategory } = await db.from('recipeCategories').select('name').eq('recipeCategoryID', recipe.recipeCategoryID).single();
      if (errorRecipeCategory) {
        global.logger.error(`Error getting recipe category for recipeCategoryID ${recipe.recipeCategoryID}: ${errorRecipeCategory.message}`);
        throw errorGen(`Error getting recipe category for recipeCategoryID ${recipe.recipeCategoryID}: ${errorRecipeCategory.message}`, 400);
      }
      const recipeWithCategoryName = recipe;
      recipeWithCategoryName.recipeCategoryName = recipeCategory.name;
      return recipeWithCategoryName;
    });
    const recipesWithCategoryNames = await Promise.all(promises);

    // for each recipe, if it has 'type' of 'subscription', get the recipeSubscription where newRecipeID = recipeID and deleted = false. Select sourceRecipeID and subscriptionID. Append these in a 'subscription' object to the recipe object
    const promises2 = recipesWithCategoryNames.map(async (recipe) => {
      if (recipe.type === 'subscription') {
        const { data: recipeSubscription, error: errorRecipeSubscription } = await db.from('recipeSubscriptions').select('sourceRecipeID, subscriptionID, startDate').eq('userID', userID).eq('newRecipeID', recipe.recipeID).eq('deleted', false).single();
        if (errorRecipeSubscription) {
          global.logger.error(`Error getting recipe subscription for newRecipeID ${recipe.recipeID}: ${errorRecipeSubscription.message}`);
          throw errorGen(`Error getting recipe subscription for newRecipeID ${recipe.recipeID}: ${errorRecipeSubscription.message}`, 400);
        }
        const recipeWithSubscription = recipe;
        recipeWithSubscription.subscription = recipeSubscription;
        return recipeWithSubscription;
      }
      return recipe;
    });
    const recipesWithSubscriptions = await Promise.all(promises2);

    const result = {
      userID,
      nameFirst: profile.name_first,
      nameLast: profile.name_last,
      username: profile.username,
      email: profile.email,
      imageURL: profile.photo_url,
      joinDate: profile.joined_at,
      city: profile.city,
      state: profile.state,
      friendCount: friendshipIDs.length ? friendshipIDs.length : 0,
      followerCount: followerIDs.length ? followerIDs.length : 0,
      recipes: recipesWithSubscriptions,
      timelineEvents: [],
      checkIngredientStock: profile.checkIngredientStock,
      autoDeleteExpiredStock: profile.autoDeleteExpiredStock,
      notifyOnLowStock: profile.notifyOnLowStock,
      notifyOnNoStock: profile.notifyOnNoStock,
      notifyUpcomingStockExpiry: profile.notifyUpcomingStockExpiry,
      notifyExpiredStock: profile.notifyExpiredStock,
      notifyFriendCreateRecipe: profile.notifyFriendCreateRecipe,
      notifyFolloweeCreateRecipe: profile.notifyFolloweeCreateRecipe,
      pushToken: profile.pushToken,
    };
    return result;
  }

  async function getProfile(options) {
    const { userID } = options;
    try {
      global.logger.info(`Successfully retrieved profile for userID ${userID}`);
      return retrieveProfile(userID);
    } catch (error) {
      global.logger.error(`Error retrieving profile for userID ${userID}: ${error.message}`);
      throw errorGen(`Error retrieving profile for userID ${userID}: ${error.message}`, 400);
    }
  }

  async function getFriends(options) {
    const { userID, friendStatus } = options;

    //get friendshipIDs of userID where deleted = false and status as requested
    const { data: friendshipIDs, error } = await db.from('friendships').select('friend').eq('userID', userID).eq('deleted', false).eq('status', friendStatus);
    if (error) {
      global.logger.error(`Error getting friendshipIDs for userID ${userID}: ${error.message}`);
      throw errorGen(`Error getting friendshipIDs for userID ${userID}: ${error.message}`, 400);
    }
    if (!friendshipIDs) {
      global.logger.error(`User with userID ${userID} has no friends`);
      throw errorGen(`User with userID ${userID} has no friends`, 400);
    }

    // Map over friendshipIDs and return a promise for each friend's profile
    const promises = friendshipIDs.map(async (friendship) => {
      try {
        const friendProfile = await retrieveProfile(friendship.friend);
        return friendProfile;
      } catch (error) {
        global.logger.error(`Error retrieving profile for userID ${friendship.friend}: ${error.message}`);
        throw errorGen(`Error retrieving profile for userID ${friendship.friend}: ${error.message}`, 400);
      }
    });
    const friendProfiles = await Promise.all(promises);
    const validFriendProfiles = friendProfiles.filter((profile) => profile !== null);

    global.logger.info(`Successfully retrieved ${validFriendProfiles.length} friends with status: ${friendStatus} for userID ${userID}`);
    return validFriendProfiles;
  }

  async function getFriend(options) {
    const { userID, friendUserID } = options;

    //get friendshipID of userID and friendUserID where deleted = false and status as 'confirmed'
    const { data: friendshipID, error } = await db.from('friendships').select('friendshipID').eq('userID', userID).eq('friend', friendUserID).eq('deleted', false).eq('status', 'confirmed').single();
    if (error) {
      global.logger.error(`Error getting friendshipID for userID ${userID} and friendUserID ${friendUserID}: ${error.message}`);
      throw errorGen(`Error getting friendshipID for userID ${userID} and friendUserID ${friendUserID}: ${error.message}`, 400);
    }
    if (!friendshipID) {
      global.logger.error(`No friendship found for userID ${userID} and friendUserID ${friendUserID}`);
      throw errorGen(`No friendship found for userID ${userID} and friendUserID ${friendUserID}`, 400);
    }

    //get friend's profile
    try {
      const friendProfile = await retrieveProfile(friendUserID);
      global.logger.info(`Successfully retrieved friend for userID ${userID} and friendUserID ${friendUserID}`);
      return friendProfile;
    } catch (error) {
      global.logger.error(`Error retrieving profile for userID ${friendUserID}: ${error.message}`);
      throw errorGen(`Error retrieving profile for userID ${friendUserID}: ${error.message}`, 400);
    }
  }

  async function getFollowers(options) {
    const { userID } = options;

    //get followshipIDs of userID where deleted = false
    const { data: followshipIDs, error } = await db.from('followships').select('userID').eq('following', userID).eq('deleted', false);
    if (error) {
      global.logger.error(`Error getting followshipIDs for userID ${userID}: ${error.message}`);
      throw errorGen(`Error getting followshipIDs for userID ${userID}: ${error.message}`, 400);
    }
    if (!followshipIDs) {
      global.logger.error(`No followers found for userID ${userID}`);
      throw errorGen(`No followers found for userID ${userID}`, 400);
    }

    const promises = followshipIDs.map(async (followship) => {
      try {
        const friendProfile = await retrieveProfile(followship.userID);
        return friendProfile;
      } catch (error) {
        global.logger.error(`Error retrieving profile for userID ${followship.userID}: ${error.message}`);
        throw errorGen(`Error retrieving profile for userID ${followship.userID}: ${error.message}`, 400);
      }
    });
    const followerProfiles = await Promise.all(promises);
    const validfollowerProfiles = followerProfiles.filter((profile) => profile !== null);

    global.logger.info(`Successfully retrieved ${validfollowerProfiles.length} followers for userID ${userID}`);
    return validfollowerProfiles;
  }

  async function getFollower(options) {
    const { userID, followerUserID } = options;

    //get followshipID of userID and followerUserID where deleted = false
    const { data: followshipID, error } = await db.from('followships').select('followshipID').eq('following', userID).eq('userID', followerUserID).eq('deleted', false).single();
    if (error) {
      global.logger.error(`Error getting followshipID for userID ${userID} and followerUserID ${followerUserID}: ${error.message}`);
      throw errorGen(`Error getting followshipID for userID ${userID} and followerUserID ${followerUserID}: ${error.message}`, 400);
    }
    if (!followshipID) {
      global.logger.error(`No followship found for userID ${userID} and followerUserID ${followerUserID}`);
      throw errorGen(`No followship found for userID ${userID} and followerUserID ${followerUserID}`, 400);
    }

    //get follower's profile
    try {
      const followerProfile = await retrieveProfile(followerUserID);
      global.logger.info(`Successfully retrieved follower for userID ${userID} and followerUserID ${followerUserID}`);
      return followerProfile;
    } catch (error) {
      global.logger.error(`Error retrieving profile for userID ${followerUserID}: ${error.message}`);
      throw errorGen(`Error retrieving profile for userID ${followerUserID}: ${error.message}`, 400);
    }
  }

  async function getFollowing(options) {
    const { userID } = options;

    //get followshipIDs where userID = userID and deleted = false
    const { data: followships, error } = await db.from('followships').select('following').eq('userID', userID).eq('deleted', false);
    if (error) {
      global.logger.error(`Error getting followshipIDs for userID ${userID}: ${error.message}`);
      throw errorGen(`Error getting followshipIDs for userID ${userID}: ${error.message}`, 400);
    }
    if (!followships) {
      global.logger.error(`No followships found for userID ${userID}`);
      throw errorGen(`No followships found for userID ${userID}`, 400);
    }

    const promises = followships.map(async (followship) => {
      try {
        const friendProfile = await retrieveProfile(followship.following);
        return friendProfile;
      } catch (error) {
        global.logger.error(`Error retrieving profile for userID ${followship.following}: ${error.message}`);
        throw errorGen(`Error retrieving profile for userID ${followship.following}: ${error.message}`, 400);
      }
    });
    const followingProfiles = await Promise.all(promises);
    const validFollowingProfiles = followingProfiles.filter((profile) => profile !== null);

    global.logger.info(`Successfully retrieved ${validFollowingProfiles.length} following for userID ${userID}`);
    return validFollowingProfiles;
  }

  async function searchProfiles(options) {
    const { searchQuery } = options;
    let q = ``;
    //split searchQuery into an array of words
    const searchWords = searchQuery.split(' ');
    //add each word to the query
    searchWords.forEach((word) => {
      q += `'${word}' & `;
    });
    //remove the last ' & ' from the query
    q = q.substring(0, q.length - 3);

    // get all userID's from dbPublic.profiles where name_first or name_last or username contains searchQuery
    const { data: profileIDs, error } = await dbPublic.from('profiles').select('user_id').textSearch(`first_last_username`, `${q}`);
    if (error) {
      global.logger.error(`Error getting profileIDs for searchQuery ${searchQuery}: ${error.message}`);
      throw errorGen(`Error getting profileIDs for searchQuery ${searchQuery}: ${error.message}`, 400);
    }

    // Map over profileIDs and return a promise for each profile
    const promises = profileIDs.map(async (profileID) => {
      try {
        const profile = await retrieveProfile(profileID.user_id, 'null');
        return profile;
      } catch (error) {
        global.logger.error(`Error retrieving profile for userID ${profileID.user_id}: ${error.message}`);
        throw errorGen(`Error retrieving profile for userID ${profileID.user_id}: ${error.message}`, 400);
      }
    });
    const profiles = await Promise.all(promises);
    const validProfiles = profiles.filter((profile) => profile !== null);

    global.logger.info(`Successfully retrieved ${validProfiles.length} profiles for searchQuery ${searchQuery}`);
    return validProfiles;
  }

  return {
    getProfile,
    getFriends,
    getFriend,
    getFollowers,
    getFollowing,
    getFollower,
    searchProfiles,
  };
};
