('use strict');
const { errorGen } = require('../../middleware/errorHandling');
const { initialData } = require('../../services/account/populateAccount');
const { default: axios } = require('axios');
const { uploadBackup, deleteOldBackup } = require('../../services/fileService');
const fs = require('fs');
const path = require('path');
const recipeCategories = require('../../services/recipeCategoryService');
const { createUserLog } = require('../../services/dbLogger');

module.exports = ({ db, dbPublic }) => {
  async function retrieveProfile(userID, friendStatus = 'confirmed') {
    try {
      // get all columns from dbPublic.profiles where userID = userID
      const { data: profile, error } = await dbPublic.from('profiles').select('*').eq('user_id', userID).single();
      if (error) {
        throw errorGen(`Error getting profile for userID ${userID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!profile) {
        throw errorGen(`No profile found for userID ${userID}`, 515, 'cannotComplete', false, 3);
      }

      // get count of rows from db.friendships where userID = userID, deleted = false and status = 'confirmed'
      const { data: friendshipIDs, error: errorFriendCount } = await db.from('friendships').select('friendshipID').eq('userID', userID).eq('deleted', false).eq('status', friendStatus);
      if (errorFriendCount) {
        throw errorGen(`Error getting friend count for userID ${userID}: ${errorFriendCount.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      // get count of rows from db.followships where following = userID and deleted = false
      const { data: followerIDs, error: errorFollowerCount } = await db.from('followships').select('followshipID').eq('following', userID).eq('deleted', false);
      if (errorFollowerCount) {
        throw errorGen(`Error getting follower count for userID ${userID}: ${errorFollowerCount.message}`, 511, 'failSupabaseSelect', true, 3);
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
        throw errorGen(`Error getting recipes for userID ${userID}: ${errorRecipes.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      // for each recipe, get the recipeCategoryName from the recipeCategoryID, then update the recipe object with recipeCategoryName
      const promises = recipes.map(async (recipe) => {
        const recipeWithCategoryName = recipe;
        recipeWithCategoryName.recipeCategoryName = recipeCategories[recipe.recipeCategoryID];
        return recipeWithCategoryName;
      });
      const recipesWithCategoryNames = await Promise.all(promises);

      // for each recipe, if it has 'type' of 'subscription', get the recipeSubscription where newRecipeID = recipeID and deleted = false. Select sourceRecipeID and subscriptionID. Append these in a 'subscription' object to the recipe object
      const promises2 = recipesWithCategoryNames.map(async (recipe) => {
        if (recipe.type === 'subscription') {
          const { data: recipeSubscription, error: errorRecipeSubscription } = await db.from('recipeSubscriptions').select('sourceRecipeID, subscriptionID, startDate').eq('userID', userID).eq('newRecipeID', recipe.recipeID).eq('deleted', false).single();
          if (errorRecipeSubscription) {
            throw errorGen(`Error getting recipe subscription for newRecipeID ${recipe.recipeID}: ${errorRecipeSubscription.message}`, 511, 'failSupabaseSelect', true, 3);
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
        lastPermRefreshDate: profile.lastPermRefreshDate,
        // permissions
        permRecipeSubscribeUnlimited: profile.permRecipeSubscribeUnlimited,
        permRecipeCreateUnlimited: profile.permRecipeCreateUnlimited,
        permDataBackupDaily6MonthRetention: profile.permDataBackupDaily6MonthRetention,
        permAITokenCount: profile.permAITokenCount,
        permAITokenLastRefreshDate: profile.permAITokenLastRefreshDate,
      };
      return result;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in profiles retrieveProfile', err.code || 520, err.name || 'unhandledError_profiles-retrieveProfile', err.isOperational || false, err.severity || 2);
    }
  }

  async function getProfile(options) {
    const { userID } = options;
    return retrieveProfile(userID);
  }

  async function getFriends(options) {
    const { userID, friendStatus } = options;

    try {
      //get friendshipIDs of userID where deleted = false and status as requested
      const { data: friendshipIDs, error } = await db.from('friendships').select('friend').eq('userID', userID).eq('deleted', false).eq('status', friendStatus);
      if (error) {
        throw errorGen(`Error getting friendshipIDs for userID ${userID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!friendshipIDs) {
        throw errorGen(`User with userID ${userID} has no friends`, 515, 'cannotComplete', false, 4);
      }

      // Map over friendshipIDs and return a promise for each friend's profile
      const promises = friendshipIDs.map(async (friendship) => {
        const friendProfile = await retrieveProfile(friendship.friend);
        return friendProfile;
      });
      const friendProfiles = await Promise.all(promises);
      const validFriendProfiles = friendProfiles.filter((profile) => profile !== null);

      global.logger.info({ message: `*profiles-getProfile* Successfully retrieved ${validFriendProfiles.length} friends with status: ${friendStatus} for userID ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return validFriendProfiles;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in profiles getFriends', err.code || 520, err.name || 'unhandledError_profiles-getFriends', err.isOperational || false, err.severity || 2);
    }
  }

  async function getFriend(options) {
    const { userID, friendUserID } = options;

    try {
      //get friendshipID of userID and friendUserID where deleted = false and status as 'confirmed'
      const { data: friendshipID, error } = await db.from('friendships').select('friendshipID').eq('userID', userID).eq('friend', friendUserID).eq('deleted', false).eq('status', 'confirmed').single();
      if (error) {
        throw errorGen(`Error getting friendshipID for userID ${userID} and friendUserID ${friendUserID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!friendshipID) {
        throw errorGen(`No friendship found for userID ${userID} and friendUserID ${friendUserID}`, 515, 'cannotComplete', false, 4);
      }

      //get friend's profile
      const friendProfile = await retrieveProfile(friendUserID);
      global.logger.info({ message: `*profiles-getFriend* Successfully retrieved friend for userID ${userID} and friendUserID ${friendUserID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return friendProfile;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in profiles getFriend', err.code || 520, err.name || 'unhandledError_profiles-getFriend', err.isOperational || false, err.severity || 2);
    }
  }

  async function getFollowers(options) {
    const { userID } = options;

    try {
      //get followshipIDs of userID where deleted = false
      const { data: followshipIDs, error } = await db.from('followships').select('userID').eq('following', userID).eq('deleted', false);
      if (error) {
        throw errorGen(`Error getting followshipIDs for userID ${userID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!followshipIDs) {
        throw errorGen(`No followers found for userID ${userID}`, 515, 'cannotComplete', false, 3);
      }

      const promises = followshipIDs.map(async (followship) => {
        const friendProfile = await retrieveProfile(followship.userID);
        return friendProfile;
      });
      const followerProfiles = await Promise.all(promises);
      const validfollowerProfiles = followerProfiles.filter((profile) => profile !== null);

      global.logger.info({ message: `*profiles-getFollowers* Successfully retrieved ${validfollowerProfiles.length} followers for userID ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return validfollowerProfiles;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in profiles getFollowers', err.code || 520, err.name || 'unhandledError_profiles-getFollowers', err.isOperational || false, err.severity || 2);
    }
  }

  async function getFollower(options) {
    const { userID, followerUserID } = options;

    try {
      //get followshipID of userID and followerUserID where deleted = false
      const { data: followshipID, error } = await db.from('followships').select('followshipID').eq('following', userID).eq('userID', followerUserID).eq('deleted', false).single();
      if (error) {
        throw errorGen(`Error getting followshipID for userID ${userID} and followerUserID ${followerUserID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!followshipID) {
        throw errorGen(`No followship found for userID ${userID} and followerUserID ${followerUserID}`, 515, 'cannotComplete', false, 3);
      }

      //get follower's profile
      const followerProfile = await retrieveProfile(followerUserID);
      global.logger.info({ message: `*profiles-getFollower* Successfully retrieved follower for userID ${userID} and followerUserID ${followerUserID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return followerProfile;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in profiles getFollower', err.code || 520, err.name || 'unhandledError_profiles-getFollower', err.isOperational || false, err.severity || 2);
    }
  }

  async function getFollowing(options) {
    const { userID } = options;

    try {
      //get followshipIDs where userID = userID and deleted = false
      const { data: followships, error } = await db.from('followships').select('following').eq('userID', userID).eq('deleted', false);
      if (error) {
        throw errorGen(`Error getting followshipIDs for userID ${userID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!followships) {
        throw errorGen(`No followships found for userID ${userID}`, 515, 'cannotComplete', false, 3);
      }

      const promises = followships.map(async (followship) => {
        const friendProfile = await retrieveProfile(followship.following);
        return friendProfile;
      });
      const followingProfiles = await Promise.all(promises);
      const validFollowingProfiles = followingProfiles.filter((profile) => profile !== null);

      global.logger.info({ message: `*profiles-getFollowing* Successfully retrieved ${validFollowingProfiles.length} following for userID ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return validFollowingProfiles;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in profiles getFollowing', err.code || 520, err.name || 'unhandledError_profiles-getFollowing', err.isOperational || false, err.severity || 2);
    }
  }

  async function searchProfiles(options) {
    const { searchQuery, userID } = options;

    try {
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
        throw errorGen(`Error getting profileIDs for searchQuery ${searchQuery}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      // Map over profileIDs and return a promise for each profile
      const promises = profileIDs.map(async (profileID) => {
        const profile = await retrieveProfile(profileID.user_id, 'null');
        return profile;
      });
      const profiles = await Promise.all(promises);
      const validProfiles = profiles.filter((profile) => profile !== null);

      global.logger.info({ message: `*profiles-searchProfiles* Successfully retrieved ${validProfiles.length} profiles for searchQuery ${searchQuery}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return validProfiles;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in profiles searchProfiles', err.code || 520, err.name || 'unhandledError_profiles-searchProfiles', err.isOperational || false, err.severity || 2);
    }
  }

  async function deleteProfile(options) {
    try {
      // call the 'permanent_profile_delete' function in supabase. A return number 1 indicates the user was found and deleted. A return number 0 indicates the user was not found.
      const { userID } = options;
      const { data, error } = await dbPublic.rpc('permanent_profile_delete', { userid: userID });
      if (error) {
        throw errorGen(`Error deleting profile for userID ${userID}: ${error.message}`, 514, 'failSupabaseDelete', true, 3);
      }
      if (data === 0) {
        throw errorGen(`No profile found for userID ${userID}`, 515, 'cannotComplete', false, 3);
      }

      // now that profile and data is deleted, call supabase method 'auth.admin.deleteUser'
      const { error: errorDeleteUser } = await dbPublic.auth.admin.deleteUser(userID);
      if (errorDeleteUser) {
        throw errorGen(`Error deleting user for userID ${userID}: ${errorDeleteUser.message}`, 515, 'cannotComplete', false, 3);
      }

      global.logger.info({ message: `*profiles-deleteProfile* Successfully deleted profile for userID ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return true;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in profiles deleteProfile', err.code || 520, err.name || 'unhandledError_profiles-deleteProfile', err.isOperational || false, err.severity || 2);
    }
  }

  async function populateAccount(options) {
    const { userID } = options;

    try {
      global.logger.info({ message: `*profiles-populateAccount* Populating initial account data for userID ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      // Prevent concurrent execution by using a lock (example using a simple flag in the database)
      const { data: lockData, error: lockError } = await dbPublic.from('profiles').select('isPopulating,dataLoadStatus').eq('user_id', userID).single();

      if (lockError) {
        throw errorGen(`Error checking lock status for userID ${userID}: ${lockError.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      if (lockData.isPopulating) {
        // if dataLoadStatus is 'done', remove lock and return 'success'
        if (lockData.dataLoadStatus === 'done') {
          await dbPublic.from('profiles').update({ isPopulating: false }).eq('user_id', userID);
          global.logger.info({ message: `*profiles-populateAccount* PopulateAccount is already running for userID ${userID}, but data is already loaded`, level: 6, timestamp: new Date().toISOString(), userID: userID });
          return 'success';
        }
        global.logger.info({ message: `*profiles-populateAccount* PopulateAccount is already running for userID ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
        return;
      }

      // Set lock
      await dbPublic.from('profiles').update({ isPopulating: true }).eq('user_id', userID);

      // Check 'dataLoadStatus'
      const { data, error } = await dbPublic.from('profiles').select('dataLoadStatus').eq('user_id', userID).single();
      if (error) {
        throw errorGen(`Error getting dataLoadStatus for userID ${userID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (data.dataLoadStatus === 'done') {
        global.logger.info({ message: `*profiles-populateAccount* Data already loaded for userID ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
        return 'success';
      }

      // Get the initial data to populate the account
      const initData = initialData;
      let currentStatus = data.dataLoadStatus;
      let currentSequence = initData[currentStatus].sequence;

      // Attempt all remaining data loading steps
      for (let i = currentSequence; i < 7; i++) {
        global.logger.info({ message: `*profiles-populateAccount* Starting data load for userID ${userID}. Current step: ${currentSequence}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
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
          case 6:
            currentStatus = 'messages';
            stepFunction = populateMessages;
            break;
          default:
            break;
        }

        if (!stepFunction) {
          throw errorGen(`No function found for step ${i}`, 515, 'cannotComplete', false, 3);
        }

        const nextStep = await stepFunction(userID, initData[currentStatus].data);
        if (nextStep === 'success') {
          currentSequence = i + 1;
        } else {
          throw errorGen(`Error in step ${i}: ${nextStep}`, 515, 'cannotComplete', false, 3);
        }
      }

      // All data is loaded. Update 'dataLoadStatus' to 'done'
      const { error: errorUpdateDataLoadStatus } = await dbPublic.from('profiles').update({ dataLoadStatus: 'done', isPopulating: false }).eq('user_id', userID);

      if (errorUpdateDataLoadStatus) {
        throw errorGen(`Error updating dataLoadStatus for userID ${userID}: ${errorUpdateDataLoadStatus.message}`, 513, 'failSupabaseUpdate', true, 3);
      }
      return 'success';
    } catch (error) {
      // Ensure lock is released in case of an error
      await dbPublic.from('profiles').update({ isPopulating: false }).eq('user_id', userID);
      throw errorGen(error.message || 'Unhandled Error in profiles populateAccount', error.code || 520, error.name || 'unhandledError_profiles-populateAccount', error.isOperational || false, error.severity || 2);
    }
  }

  async function populateFriendships(userID, array) {
    try {
      global.logger.info({ message: `*profiles-populateFriendships* Populating friendships`, level: 6, timestamp: new Date().toISOString(), userID: userID || 0 });
      // remove any existing friendships for userID, we'll start from scratch
      const { error: errorDeleteFriendships } = await db.from('friendships').delete().eq('userID', userID);
      if (errorDeleteFriendships) {
        throw errorGen(`Error deleting friendships for userID ${userID}: ${errorDeleteFriendships.message}`, 514, 'failSupabaseDelete', true, 3);
      }
      // also delete any friendships where friend = userID
      const { error: errorDeleteFriendships2 } = await db.from('friendships').delete().eq('friend', userID);
      if (errorDeleteFriendships2) {
        throw errorGen(`Error deleting friendships for friend ${userID}: ${errorDeleteFriendships2.message}`, 514, 'failSupabaseDelete', true, 3);
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
          throw errorGen(
            errorCreateFriendship.message || 'Unhandled Error in profiles populateFriendships',
            errorCreateFriendship.code || 520,
            errorCreateFriendship.name || 'unhandledError_profiles-populateFriendships',
            errorCreateFriendship.isOperational || false,
            errorCreateFriendship.severity || 2,
          );
        }
      }

      // assuming we're here, we've successfully created all friendships. Update 'dataLoadStatus'
      const { error: errorUpdateDataLoadStatus } = await dbPublic.from('profiles').update({ dataLoadStatus: 'followships' }).eq('user_id', userID);
      if (errorUpdateDataLoadStatus) {
        throw errorGen(`Error updating dataLoadStatus for userID ${userID}: ${errorUpdateDataLoadStatus.message}`, 513, 'failSupabaseUpdate', true, 3);
      }

      return 'success';
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in profiles populateFriendships', err.code || 520, err.name || 'unhandledError_profiles-populateFriendships', err.isOperational || false, err.severity || 2);
    }
  }

  async function populateFollowships(userID, array) {
    try {
      global.logger.info({ message: `*profiles-populateFollowships* Populating followships for userID ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      // remove any existing followships for userID, we'll start from scratch
      const { error: errorDeleteFollowships } = await db.from('followships').delete().eq('userID', userID);
      if (errorDeleteFollowships) {
        throw errorGen(`Error deleting followships for userID ${userID}: ${errorDeleteFollowships.message}`, 514, 'failSupabaseDelete', true, 3);
      }

      // also delete any followships where following = userID
      const { error: errorDeleteFollowships2 } = await db.from('followships').delete().eq('following', userID);
      if (errorDeleteFollowships2) {
        throw errorGen(`Error deleting followships for following ${userID}: ${errorDeleteFollowships2.message}`, 514, 'failSupabaseDelete', true, 3);
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
          throw errorGen(
            errorCreateFollowship.message || 'Unhandled Error in profiles populateFollowships',
            errorCreateFollowship.code || 520,
            errorCreateFollowship.name || 'unhandledError_profiles-populateFollowships',
            errorCreateFollowship.isOperational || false,
            errorCreateFollowship.severity || 2,
          );
        }
      }

      // assuming we're here, we've successfully created all followships. Update 'dataLoadStatus'
      const { error: errorUpdateDataLoadStatus } = await dbPublic.from('profiles').update({ dataLoadStatus: 'ingredients' }).eq('user_id', userID);
      if (errorUpdateDataLoadStatus) {
        throw errorGen(`Error updating dataLoadStatus for userID ${userID}: ${errorUpdateDataLoadStatus.message}`, 513, 'failSupabaseUpdate', true, 3);
      }

      return 'success';
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in profiles populateFollowships', err.code || 520, err.name || 'unhandledError_profiles-populateFollowships', err.isOperational || false, err.severity || 2);
    }
  }

  async function populateIngredients(userID, array) {
    try {
      global.logger.info({ message: `*profiles-populateIngredients* Populating ingredients for userID ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      // remove any existing ingredients for userID, we'll start from scratch
      const { error: errorDeleteIngredients } = await db.from('ingredients').delete().eq('userID', userID);
      if (errorDeleteIngredients) {
        throw errorGen(`Error deleting ingredients for userID ${userID}: ${errorDeleteIngredients.message}`, 514, 'failSupabaseDelete', true, 3);
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
          throw errorGen(
            errorCreateIngredient.message || 'Unhandled Error in profiles populateIngredients',
            errorCreateIngredient.code || 520,
            errorCreateIngredient.name || 'unhandledError_profiles-populateIngredients',
            errorCreateIngredient.isOperational || false,
            errorCreateIngredient.severity || 2,
          );
        }
      }

      // assuming we're here, we've successfully created all ingredients. Update 'dataLoadStatus'
      const { error: errorUpdateDataLoadStatus } = await dbPublic.from('profiles').update({ dataLoadStatus: 'tools' }).eq('user_id', userID);
      if (errorUpdateDataLoadStatus) {
        throw errorGen(`Error updating dataLoadStatus for userID ${userID}: ${errorUpdateDataLoadStatus.message}`, 513, 'failSupabaseUpdate', true, 3);
      }

      return 'success';
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in profiles populateIngredients', err.code || 520, err.name || 'unhandledError_profiles-populateIngredients', err.isOperational || false, err.severity || 2);
    }
  }

  async function populateTools(userID, array) {
    try {
      global.logger.info({ message: `*profiles-populateTools* Populating tools for userID ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      // remove any existing tools for userID, we'll start from scratch
      const { error: errorDeleteTools } = await db.from('tools').delete().eq('userID', userID);
      if (errorDeleteTools) {
        throw errorGen(`Error deleting tools for userID ${userID}: ${errorDeleteTools.message}`, 514, 'failSupabaseDelete', true, 3);
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
          throw errorGen(errorCreateTool.message || 'Unhandled Error in profiles populateTools', errorCreateTool.code || 520, errorCreateTool.name || 'unhandledError_profiles-populateTools', errorCreateTool.isOperational || false, errorCreateTool.severity || 2);
        }
      }

      // assuming we're here, we've successfully created all tools. Update 'dataLoadStatus'
      const { error: errorUpdateDataLoadStatus } = await dbPublic.from('profiles').update({ dataLoadStatus: 'recipes' }).eq('user_id', userID);
      if (errorUpdateDataLoadStatus) {
        throw errorGen(`Error updating dataLoadStatus for userID ${userID}: ${errorUpdateDataLoadStatus.message}`, 513, 'failSupabaseUpdate', true, 3);
      }

      return 'success';
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in profiles populateTools', err.code || 520, err.name || 'unhandledError_profiles-populateTools', err.isOperational || false, err.severity || 2);
    }
  }

  async function populateRecipes(userID, array) {
    try {
      global.logger.info({ message: `*profiles-populateRecipes* Populating recipes for userID ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      // remove any existing recipes for userID, we'll start from scratch
      const { error: errorDeleteRecipes } = await db.from('recipes').delete().eq('userID', userID);
      if (errorDeleteRecipes) {
        throw errorGen(`Error deleting recipes for userID ${userID}: ${errorDeleteRecipes.message}`, 514, 'failSupabaseDelete', true, 3);
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
          throw errorGen(errorCreateRecipe.message || 'Unhandled Error in profiles populateRecipes', errorCreateRecipe.code || 520, errorCreateRecipe.name || 'unhandledError_profiles-populateRecipes', errorCreateRecipe.isOperational || false, errorCreateRecipe.severity || 2);
        }
      }
      // update 'freeTier' to true for all userID's recipes
      const { error: errorUpdateFreeTier } = await db.from('recipes').update({ freeTier: true }).eq('userID', userID);
      if (errorUpdateFreeTier) {
        throw errorGen(`Error updating freeTier for userID ${userID}: ${errorUpdateFreeTier.message}`, 513, 'failSupabaseUpdate', true, 3);
      }

      // assuming we're here, we've successfully created all recipes. Update 'dataLoadStatus'
      const { error: errorUpdateDataLoadStatus } = await dbPublic.from('profiles').update({ dataLoadStatus: 'messages' }).eq('user_id', userID);
      if (errorUpdateDataLoadStatus) {
        throw errorGen(`Error updating dataLoadStatus for userID ${userID}: ${errorUpdateDataLoadStatus.message}`, 513, 'failSupabaseUpdate', true, 3);
      }

      return 'success';
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in profiles populateRecipes', err.code || 520, err.name || 'unhandledError_profiles-populateRecipes', err.isOperational || false, err.severity || 2);
    }
  }

  async function populateMessages(userID, array) {
    try {
      global.logger.info({ message: `*profiles-populateMessages* Populating messages for userID ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      // remove any existing messages for userID, we'll start from scratch
      const { error: errorDeleteMessages } = await db.from('messages').delete().eq('userID', userID);
      if (errorDeleteMessages) {
        throw errorGen(`Error deleting messages for userID ${userID}: ${errorDeleteMessages.message}`, 514, 'failSupabaseDelete', true, 3);
      }

      // currently just adding a default welcome message using dedicated /messages endpoint
      await axios.post(
        `${process.env.NODE_HOST}:${process.env.PORT}/messages/welcome`,
        {
          userID,
        },
        { headers: { authorization: 'override' } },
      );

      // assuming we're here, we've successfully created all messages. Update 'dataLoadStatus'
      const { error: errorUpdateDataLoadStatus } = await dbPublic.from('profiles').update({ dataLoadStatus: 'done' }).eq('user_id', userID);
      if (errorUpdateDataLoadStatus) {
        throw errorGen(`Error updating dataLoadStatus for userID ${userID}: ${errorUpdateDataLoadStatus.message}`, 513, 'failSupabaseUpdate', true, 3);
      }

      return 'success';
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in profiles populateMessages', err.code || 520, err.name || 'unhandledError_profiles-populateMessages', err.isOperational || false, err.severity || 2);
    }
  }

  async function createUserBackupFile(userID) {
    try {
      // for the given user, create a new sql backup file with all 'bakery' schema table rows. Add these rows in the order they should be loaded into the db.
      global.logger.info({ message: `*profiles-createUserBackupFile* Creating backup file for userID ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
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

      let backupScript = '';

      for (const table of tables) {
        const { data, error } = await db.from(table).select('*').eq('userID', userID);
        if (error) {
          throw errorGen(`Error getting data for table ${table} and userID ${userID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
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

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
      }

      fs.writeFileSync(filePath, backupScript);
      global.logger.info({ message: `*profiles-createUserBackupFile* Successfully created backup file for userID ${userID} on ${datestring}`, level: 6, timestamp: new Date().toISOString(), userID: userID });

      return { filePath };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in profiles createUserBackupFile', err.code || 520, err.name || 'unhandledError_profiles-createUserBackupFile', err.isOperational || false, err.severity || 2);
    }
  }

  async function createDailyBackup(options) {
    const { userID } = options;

    try {
      const { filePath } = await createUserBackupFile(userID);

      const uploadResponse = await uploadBackup('daily', userID, filePath);
      if (uploadResponse.error) {
        throw errorGen(uploadResponse.error.message || 'Unhandled Error in profiles createDailyBackup', uploadResponse.error.code || 520, uploadResponse.error.name || 'unhandledError_profiles-createDailyBackup', uploadResponse.error.isOperational || false, uploadResponse.error.severity || 2);
      }
      global.logger.info({ message: `*profiles-createDailyBackup* Successfully uploaded daily backup for user ${userID}, filename: ${filePath}`, level: 6, timestamp: new Date().toISOString(), userID: userID });

      const { data: profile, errorProfile } = await dbPublic.from('profiles').select('joined_at').eq('user_id', userID).single();
      if (errorProfile) {
        throw errorGen(`Error getting joined_at date for user ${userID}: ${errorProfile.message}`, 511, 'failSupabaseSelect', true, 3);
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

      global.logger.info({ message: `*profiles-createDailyBackup* Successfully created daily backup for user ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in profiles createDailyBackup', err.code || 520, err.name || 'unhandledError_profiles-createDailyBackup', err.isOperational || false, err.severity || 2);
    }
  }

  async function dailyBackupAllUsers() {
    try {
      // get all userIDs
      const { data: userIDs, error } = await dbPublic.from('profiles').select('user_id');
      if (error) {
        throw errorGen(`Error getting userIDs for daily backup: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      // for each userID, create a daily backup. avoid doing this for username 'Doughly' (it has 300 recipes, we have a separate master backup for it)
      for (let i = 0; i < userIDs.length; i++) {
        if (userIDs[i].user_id !== 'a525810e-5531-4f97-95a4-39a082f7416b') {
          await createDailyBackup({ userID: userIDs[i].user_id });
        }
      }

      global.logger.info({ message: `*profiles-dailyBackupAllUsers* Successfully created daily backups for all ${userIDs.length} users`, level: 6, timestamp: new Date().toISOString(), userID: 0 });
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in profiles dailyBackupAllUsers', err.code || 520, err.name || 'unhandledError_profiles-dailyBackupAllUsers', err.isOperational || false, err.severity || 2);
    }
  }

  async function loadedData(options) {
    const { userID, authorization } = options;
    // add a user log noting that the user loaded their account data successfully
    createUserLog(userID, authorization, 'dataLoaded', 1, null, null, null, `User ${userID} loaded account data`);
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
    loadedData,
  };
};
