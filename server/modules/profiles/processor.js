('use strict');
const { errorGen } = require('../../middleware/errorHandling');
const { initialData } = require('../../services/account/populateAccount');
const { default: axios } = require('axios');
const { uploadBackup, deleteOldBackup } = require('../../services/fileService');
const fs = require('fs');
const path = require('path');
const recipeCategories = require('../../services/recipeCategoryService');
const { replaceFilePath } = require('../../services/fileService.js');

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
      const recipeWithCategoryName = recipe;
      recipeWithCategoryName.photoURL = await replaceFilePath(recipeWithCategoryName.photoURL);
      recipeWithCategoryName.recipeCategoryName = recipeCategories[recipe.recipeCategoryID];
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
      onboardingState: profile.onboardingState,
      checkIngredientStock: profile.checkIngredientStock,
      autoDeleteExpiredStock: profile.autoDeleteExpiredStock,
      notifyOnLowStock: profile.notifyOnLowStock,
      notifyOnNoStock: profile.notifyOnNoStock,
      notifyUpcomingStockExpiry: profile.notifyUpcomingStockExpiry,
      notifyExpiredStock: profile.notifyExpiredStock,
      notifyFriendCreateRecipe: profile.notifyFriendCreateRecipe,
      notifyFolloweeCreateRecipe: profile.notifyFolloweeCreateRecipe,
      notifyFriendRequest: profile.notifyFriendRequest,
      notifyNewFollower: profile.notifyNewFollower,
      darkMode: profile.darkMode,
      // permissions
      permRecipeSubscribeUnlimited: profile.permRecipeSubscribeUnlimited,
      permRecipeCreateUnlimited: profile.permRecipeCreateUnlimited,
      permDataBackupDaily6MonthRetention: profile.permDataBackupDaily6MonthRetention,
      permAITokenCount: profile.permAITokenCount,
      permAITokenLastRefreshDate: profile.permAITokenLastRefreshDate,
    };

    result.imageURL = await replaceFilePath(result.imageURL)
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

  async function deleteProfile(options) {
    // call the 'permanent_profile_delete' function in supabase. A return number 1 indicates the user was found and deleted. A return number 0 indicates the user was not found.
    global.logger.info(`Deleting profile for userID ${options.userID}`);
    const { userID } = options;
    const { data, error } = await dbPublic.rpc('permanent_profile_delete', { userid: userID });
    global.logger.info(`data: ${data}`);
    if (error) {
      global.logger.error(`Error deleting profile for userID ${userID}: ${error.message}`);
      throw errorGen(`Error deleting profile for userID ${userID}: ${error.message}`, 400);
    }
    if (data === 0) {
      global.logger.error(`No profile found for userID ${userID}`);
      throw errorGen(`No profile found for userID ${userID}`, 400);
    }

    // now that profile and data is deleted, call supabase method 'auth.admin.deleteUser'
    const { error: errorDeleteUser } = await dbPublic.auth.admin.deleteUser(userID);
    if (errorDeleteUser) {
      global.logger.error(`Error deleting user for userID ${userID}: ${errorDeleteUser.message}`);
      throw errorGen(`Error deleting user for userID ${userID}: ${errorDeleteUser.message}`, 400);
    }

    global.logger.info(`Successfully deleted profile for userID ${userID}`);
    return true;
  }

  async function populateAccount(options) {
    const { userID } = options;

    global.logger.info(`Populating initial account data for userID ${userID}`);
    try {
      // Prevent concurrent execution by using a lock (example using a simple flag in the database)
      const { data: lockData, error: lockError } = await dbPublic.from('profiles').select('isPopulating').eq('user_id', userID).single();

      if (lockError) {
        global.logger.error(`Error checking lock status for userID ${userID}: ${lockError.message}`);
        throw errorGen(`Error checking lock status for userID ${userID}: ${lockError.message}`, 400);
      }

      if (lockData.isPopulating) {
        global.logger.info(`PopulateAccount is already running for userID ${userID}`);
        return;
      }

      // Set lock
      await dbPublic.from('profiles').update({ isPopulating: true }).eq('user_id', userID);

      // Check 'dataLoadStatus'
      const { data, error } = await dbPublic.from('profiles').select('dataLoadStatus').eq('user_id', userID).single();
      if (error) {
        global.logger.error(`Error getting dataLoadStatus for userID ${userID}: ${error.message}`);
        throw errorGen(`Error getting dataLoadStatus for userID ${userID}: ${error.message}`, 400);
      }
      if (data.dataLoadStatus === 'done') {
        global.logger.info(`Data already loaded for userID ${userID}`);
        return 'success';
      }

      // Get the initial data to populate the account
      const initData = initialData;
      let currentStatus = data.dataLoadStatus;
      let currentSequence = initData[currentStatus].sequence;

      // Attempt all remaining data loading steps
      for (let i = currentSequence; i < 6; i++) {
        global.logger.info(`Starting data load for userID ${userID}. Current step: ${currentSequence}`);
        // Call helper function for this step
        let stepFunction;
        switch (i) {
          case 1:
            currentStatus = 'friendships';
            stepFunction = populateFriendships;
            break;
          case 2:
            currentStatus = 'followships';
            stepFunction = populateFollowships;
            break;
          case 3:
            currentStatus = 'ingredients';
            stepFunction = populateIngredients;
            break;
          case 4:
            currentStatus = 'tools';
            stepFunction = populateTools;
            break;
          case 5:
            currentStatus = 'recipes';
            stepFunction = populateRecipes;
            break;
          default:
            break;
        }

        if (!stepFunction) {
          global.logger.error(`No function found for step ${i}`);
          throw errorGen(`No function found for step ${i}`, 400);
        }

        const nextStep = await stepFunction(userID, initData[currentStatus].data);
        if (nextStep === 'success') {
          currentSequence = i + 1;
        } else {
          global.logger.error(`Error in step ${i}: ${nextStep}`);
          throw errorGen(`Error in step ${i}: ${nextStep}`, 400);
        }
      }

      // All data is loaded. Update 'dataLoadStatus' to 'done'
      const { error: errorUpdateDataLoadStatus } = await dbPublic.from('profiles').update({ dataLoadStatus: 'done', isPopulating: false }).eq('user_id', userID);

      if (errorUpdateDataLoadStatus) {
        global.logger.error(`Error updating dataLoadStatus for userID ${userID}: ${errorUpdateDataLoadStatus.message}`);
        throw errorGen(`Error updating dataLoadStatus for userID ${userID}: ${errorUpdateDataLoadStatus.message}`, 400);
      }
      return 'success';
    } catch (error) {
      // Ensure lock is released in case of an error
      await dbPublic.from('profiles').update({ isPopulating: false }).eq('user_id', userID);
      global.logger.error(`Error populating initial account data for userID ${userID}: ${error.message}`);
      throw errorGen(`Error populating initial account data for userID ${userID}: ${error.message}`, 400);
    }
  }

  async function populateFriendships(userID, array) {
    global.logger.info(`Populating friendships for userID ${userID}`);
    // remove any existing friendships for userID, we'll start from scratch
    const { error: errorDeleteFriendships } = await db.from('friendships').delete().eq('userID', userID);
    if (errorDeleteFriendships) {
      global.logger.error(`Error deleting friendships for userID ${userID}: ${errorDeleteFriendships.message}`);
      throw errorGen(`Error deleting friendships for userID ${userID}: ${errorDeleteFriendships.message}`, 400);
    }
    // also delete any friendships where friend = userID
    const { error: errorDeleteFriendships2 } = await db.from('friendships').delete().eq('friend', userID);
    if (errorDeleteFriendships2) {
      global.logger.error(`Error deleting friendships for friend ${userID}: ${errorDeleteFriendships2.message}`);
      throw errorGen(`Error deleting friendships for friend ${userID}: ${errorDeleteFriendships2.message}`, 400);
    }

    // create initial friendships (inverse will be handled by the endpoint)
    for (let f = 0; f < array.length; f++) {
      const { error: errorCreateFriendship } = await axios.post(
        `${process.env.NODE_HOST}:${process.env.PORT}/persons/friendships`,
        {
          userID: userID,
          friend: array[f].friend,
          status: 'confirmed',
          IDtype: 23,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: 'override',
          },
        },
      );
      if (errorCreateFriendship) {
        global.logger.error(`Error creating friendship for userID ${userID} and friend ${f.friend}: ${errorCreateFriendship.message}`);
        throw errorGen(`Error creating friendship for userID ${userID} and friend ${f.friend}: ${errorCreateFriendship.message}`, 400);
      }
    }

    // assuming we're here, we've successfully created all friendships. Update 'dataLoadStatus'
    const { error: errorUpdateDataLoadStatus } = await dbPublic.from('profiles').update({ dataLoadStatus: 'followships' }).eq('user_id', userID);
    if (errorUpdateDataLoadStatus) {
      global.logger.error(`Error updating dataLoadStatus for userID ${userID}: ${errorUpdateDataLoadStatus.message}`);
      throw errorGen(`Error updating dataLoadStatus for userID ${userID}: ${errorUpdateDataLoadStatus.message}`, 400);
    }

    return 'success';
  }

  async function populateFollowships(userID, array) {
    global.logger.info(`Populating followships for userID ${userID}`);
    // remove any existing followships for userID, we'll start from scratch
    const { error: errorDeleteFollowships } = await db.from('followships').delete().eq('userID', userID);
    if (errorDeleteFollowships) {
      global.logger.error(`Error deleting followships for userID ${userID}: ${errorDeleteFollowships.message}`);
      throw errorGen(`Error deleting followships for userID ${userID}: ${errorDeleteFollowships.message}`, 400);
    }

    // also delete any followships where following = userID
    const { error: errorDeleteFollowships2 } = await db.from('followships').delete().eq('following', userID);
    if (errorDeleteFollowships2) {
      global.logger.error(`Error deleting followships for following ${userID}: ${errorDeleteFollowships2.message}`);
      throw errorGen(`Error deleting followships for following ${userID}: ${errorDeleteFollowships2.message}`, 400);
    }

    // create initial followships
    for (let f = 0; f < array.length; f++) {
      const { error: errorCreateFollowship } = await axios.post(
        `${process.env.NODE_HOST}:${process.env.PORT}/persons/followships`,
        {
          userID: userID,
          following: array[f].following,
          IDtype: 24,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: 'override',
          },
        },
      );
      if (errorCreateFollowship) {
        global.logger.error(`Error creating followship for userID ${userID} and following ${f.following}: ${errorCreateFollowship.message}`);
        throw errorGen(`Error creating followship for userID ${userID} and following ${f.following}: ${errorCreateFollowship.message}`, 400);
      }
    }

    // assuming we're here, we've successfully created all followships. Update 'dataLoadStatus'
    const { error: errorUpdateDataLoadStatus } = await dbPublic.from('profiles').update({ dataLoadStatus: 'ingredients' }).eq('user_id', userID);
    if (errorUpdateDataLoadStatus) {
      global.logger.error(`Error updating dataLoadStatus for userID ${userID}: ${errorUpdateDataLoadStatus.message}`);
      throw errorGen(`Error updating dataLoadStatus for userID ${userID}: ${errorUpdateDataLoadStatus.message}`, 400);
    }

    return 'success';
  }

  async function populateIngredients(userID, array) {
    global.logger.info(`Populating ingredients for userID ${userID}`);
    // remove any existing ingredients for userID, we'll start from scratch
    const { error: errorDeleteIngredients } = await db.from('ingredients').delete().eq('userID', userID);
    if (errorDeleteIngredients) {
      global.logger.error(`Error deleting ingredients for userID ${userID}: ${errorDeleteIngredients.message}`);
      throw errorGen(`Error deleting ingredients for userID ${userID}: ${errorDeleteIngredients.message}`, 400);
    }

    // create initial ingredients
    for (let i = 0; i < array.length; i++) {
      const { error: errorCreateIngredient } = await axios.post(
        `${process.env.NODE_HOST}:${process.env.PORT}/ingredients`,
        {
          userID: userID,
          name: array[i].name,
          lifespanDays: array[i].lifespanDays,
          purchaseUnit: array[i].purchaseUnit,
          gramRatio: array[i].gramRatio,
          brand: array[i].brand,
          needsReview: array[i].needsReview,
          IDtype: 12,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: 'override',
          },
        },
      );
      if (errorCreateIngredient) {
        global.logger.error(`Error creating ingredient for userID ${userID}: ${errorCreateIngredient.message}`);
        throw errorGen(`Error creating ingredient for userID ${userID}: ${errorCreateIngredient.message}`, 400);
      }
    }

    // assuming we're here, we've successfully created all ingredients. Update 'dataLoadStatus'
    const { error: errorUpdateDataLoadStatus } = await dbPublic.from('profiles').update({ dataLoadStatus: 'tools' }).eq('user_id', userID);
    if (errorUpdateDataLoadStatus) {
      global.logger.error(`Error updating dataLoadStatus for userID ${userID}: ${errorUpdateDataLoadStatus.message}`);
      throw errorGen(`Error updating dataLoadStatus for userID ${userID}: ${errorUpdateDataLoadStatus.message}`, 400);
    }

    return 'success';
  }

  async function populateTools(userID, array) {
    global.logger.info(`Populating tools for userID ${userID}`);
    // remove any existing tools for userID, we'll start from scratch
    const { error: errorDeleteTools } = await db.from('tools').delete().eq('userID', userID);
    if (errorDeleteTools) {
      global.logger.error(`Error deleting tools for userID ${userID}: ${errorDeleteTools.message}`);
      throw errorGen(`Error deleting tools for userID ${userID}: ${errorDeleteTools.message}`, 400);
    }

    // create initial tools
    for (let i = 0; i < array.length; i++) {
      const { error: errorCreateTool } = await axios.post(
        `${process.env.NODE_HOST}:${process.env.PORT}/tools`,
        {
          userID: userID,
          name: array[i].name,
          brand: array[i].brand,
          IDtype: 14,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: 'override',
          },
        },
      );
      if (errorCreateTool) {
        global.logger.error(`Error creating tool for userID ${userID}: ${errorCreateTool.message}`);
        throw errorGen(`Error creating tool for userID ${userID}: ${errorCreateTool.message}`, 400);
      }
    }

    // assuming we're here, we've successfully created all tools. Update 'dataLoadStatus'
    const { error: errorUpdateDataLoadStatus } = await dbPublic.from('profiles').update({ dataLoadStatus: 'recipes' }).eq('user_id', userID);
    if (errorUpdateDataLoadStatus) {
      global.logger.error(`Error updating dataLoadStatus for userID ${userID}: ${errorUpdateDataLoadStatus.message}`);
      throw errorGen(`Error updating dataLoadStatus for userID ${userID}: ${errorUpdateDataLoadStatus.message}`, 400);
    }

    return 'success';
  }

  async function populateRecipes(userID, array) {
    global.logger.info(`Populating recipes for userID ${userID}`);
    //11
    // remove any existing recipes for userID, we'll start from scratch
    const { error: errorDeleteRecipes } = await db.from('recipes').delete().eq('userID', userID);
    if (errorDeleteRecipes) {
      global.logger.error(`Error deleting recipes for userID ${userID}: ${errorDeleteRecipes.message}`);
      throw errorGen(`Error deleting recipes for userID ${userID}: ${errorDeleteRecipes.message}`, 400);
    }

    for (let i = 0; i < array.length; i++) {
      const body = array[i];
      body.userID = userID;
      // create initial recipes
      const { error: errorCreateRecipe } = await axios.post(`${process.env.NODE_HOST}:${process.env.PORT}/recipes/constructed`, body, {
        headers: {
          'Content-Type': 'application/json',
          authorization: 'override',
        },
      });
      if (errorCreateRecipe) {
        global.logger.error(`Error creating recipe for userID ${userID}: ${errorCreateRecipe.message}`);
        throw errorGen(`Error creating recipe for userID ${userID}: ${errorCreateRecipe.message}`, 400);
      }
    }
    // update 'freeTier' to true for all userID's recipes
    const { error: errorUpdateFreeTier } = await db.from('recipes').update({ freeTier: true }).eq('userID', userID);
    if (errorUpdateFreeTier) {
      global.logger.error(`Error updating freeTier for userID ${userID}: ${errorUpdateFreeTier.message}`);
      throw errorGen(`Error updating freeTier for userID ${userID}: ${errorUpdateFreeTier.message}`, 400);
    }

    // assuming we're here, we've successfully created all recipes. Update 'dataLoadStatus'
    const { error: errorUpdateDataLoadStatus } = await dbPublic.from('profiles').update({ dataLoadStatus: 'recipeSubscriptions' }).eq('user_id', userID);
    if (errorUpdateDataLoadStatus) {
      global.logger.error(`Error updating dataLoadStatus for userID ${userID}: ${errorUpdateDataLoadStatus.message}`);
      throw errorGen(`Error updating dataLoadStatus for userID ${userID}: ${errorUpdateDataLoadStatus.message}`, 400);
    }

    return 'success';
  }

  async function createUserBackupFile(userID) {
    // for the given user, create a new sql backup file with all 'bakery' schema table rows. Add these rows in the order they should be loaded into the db.
    global.logger.info(`Creating backup file for userID ${userID}`);
    const tables = [
      'pushTokens',
      'friendships',
      'followships',
      'ingredients',
      'ingredientStocks',
      'tools',
      'toolStocks',
      'steps',
      'recipes',
      'recipeIngredients',
      'recipeTools',
      'recipeSteps',
      'recipeSubscriptions',
      'shoppingLists',
      'shoppingListIngredients',
      'shoppingListRecipes',
      'shoppingLogs',
      'userLogs',
      'recipeLogs',
      'recipeFeedbacks',
      'kitchenLogs',
      'messages',
    ];

    try {
      let backupScript = '';

      for (const table of tables) {
        const { data, error } = await db.from(table).select('*').eq('userID', userID);
        if (error) {
          global.logger.error(`Error getting data for table ${table} and userID ${userID}: ${error.message}`);
          throw errorGen(`Error getting data for table ${table} and userID ${userID}: ${error.message}`, 400);
        }

        if (data.length) {
          const columnNames = Object.keys(data[0]);
          const quotedColumnNames = columnNames.map((name) => `"${name}"`);
          data.forEach((row) => {
            const values = columnNames.map((column) => (row[column] !== null ? `'${String(row[column]).replace(/'/g, "''")}'` : 'NULL')).join(', ');
            backupScript += `INSERT INTO bakery."${table}" (${quotedColumnNames.join(', ')}) VALUES (${values});\n`;
          });
        }
      }
      // create dateString such as '05212024' for May 21, 2024. Include trailing 0's for single digit months and days.
      const date = new Date();
      const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
      const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
      const datestring = `${month}${day}${date.getFullYear()}`;
      const dirPath = path.join(__dirname, '../../temp');
      const filePath = path.join(dirPath, `backup-bakery_${datestring}.sql`);

      // const tempFilePath = path.join(__dirname, filePath);

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
      }

      fs.writeFileSync(filePath, backupScript);
      global.logger.info(`Successfully created backup file for userID ${userID} on ${datestring}`);

      return { filePath };
    } catch (error) {
      global.logger.error(`Error creating backup file: ${error.message}`);
      throw new Error(`Error creating backup file: ${error.message}`);
    }
  }

  async function createDailyBackup(options) {
    const { userID } = options;

    try {
      const { filePath } = await createUserBackupFile(userID);

      const uploadResponse = await uploadBackup('daily', userID, filePath);
      if (uploadResponse.error) {
        global.logger.error(`Error uploading daily backup for user ${userID}: ${uploadResponse.error.message}`);
        throw errorGen(`Error uploading daily backup for user ${userID}: ${uploadResponse.error.message}`, 400);
      }
      global.logger.info(`Successfully uploaded daily backup for user ${userID}, filename: ${filePath}`);

      const { data: profile, errorProfile } = await dbPublic.from('profiles').select('joined_at').eq('user_id', userID).single();
      if (errorProfile) {
        global.logger.error(`Error getting joined_at date for user ${userID}: ${errorProfile.message}`);
        throw errorGen(`Error getting joined_at date for user ${userID}: ${errorProfile.message}`, 400);
      }

      const daysSinceJoin = Math.floor((new Date() - new Date(profile.joined_at)) / (1000 * 60 * 60 * 24));

      // if daysSinceJoin is not divisible by 7, we need to delete the backup for the day that is 7 days before the current day
      if (daysSinceJoin % 7 !== 0) {
        // create dateString such as '05212024' for May 21, 2024. Include trailing 0's for single digit months and days.
        const date = new Date();
        const deleteDate = new Date(date.setDate(date.getDate() - 7));
        const deleteMonth = deleteDate.getMonth() + 1 < 10 ? `0${deleteDate.getMonth() + 1}` : deleteDate.getMonth() + 1;
        const deleteDay = deleteDate.getDate() < 10 ? `0${deleteDate.getDate()}` : deleteDate.getDate();
        const deleteDateString = `${deleteMonth}${deleteDay}${deleteDate.getFullYear()}`;
        const deleteFileName = `backup-bakery_${deleteDateString}.sql`;
        await deleteOldBackup(userID, deleteFileName);
      }

      global.logger.info(`Successfully created daily backup for user ${userID}`);
    } catch (error) {
      global.logger.error(`Error creating daily backup for user ${userID}: ${error.message}`);
      throw errorGen(`Error creating daily backup for user ${userID}: ${error.message}`, 400);
    }
  }

  async function dailyBackupAllUsers() {
    // get all userIDs
    const { data: userIDs, error } = await dbPublic.from('profiles').select('user_id');
    if (error) {
      global.logger.error(`Error getting userIDs for daily backup: ${error.message}`);
      throw errorGen(`Error getting userIDs for daily backup: ${error.message}`, 400);
    }

    // for each userID, create a daily backup. avoid doing this for username 'Doughly' (it has 300 recipes, we have a separate master backup for it)
    for (let i = 0; i < userIDs.length; i++) {
      if (userIDs[i].user_id !== 'a525810e-5531-4f97-95a4-39a082f7416b') {
        await createDailyBackup({ userID: userIDs[i].user_id });
      }
    }

    global.logger.info(`Successfully created daily backups for all ${userIDs.length} users`);
  }

  return {
    getProfile,
    getFriends,
    getFriend,
    getFollowers,
    getFollowing,
    getFollower,
    searchProfiles,
    deleteProfile,
    populateAccount,
    createDailyBackup,
    dailyBackupAllUsers,
  };
};
