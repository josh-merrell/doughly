('use strict');

module.exports = ({ db, dbPublic }) => {
  async function retrieveProfile(userID) {
    // get all columns from dbPublic.profiles where userID = userID
    const { data: profile, error } = await dbPublic.from('profiles').select('*').eq('user_id', userID).single();
    if (error) {
      global.logger.info(`Error getting profile for userID ${userID}: ${error.message}`);
      return { error };
    }
    if (!profile) {
      global.logger.info(`No profile found for userID ${userID}`);
      return { error: { message: `No profile found for userID ${userID}` } };
    }

    // get count of rows from db.friendships where userID = userID, deleted = false and status = 'confirmed'
    const { data: friendshipIDs, error: errorFriendCount } = await db.from('friendships').select('friendshipID').eq('userID', userID).eq('deleted', false).eq('status', 'confirmed');
    if (errorFriendCount) {
      global.logger.info(`Error getting friend count for userID ${userID}: ${errorFriendCount.message}`);
      return { error: errorFriendCount };
    }

    // get count of rows from db.followships where following = userID and deleted = false
    const { data: followerIDs, error: errorFollowerCount } = await db.from('followships').select('followshipID').eq('following', userID).eq('deleted', false);
    if (errorFollowerCount) {
      global.logger.info(`Error getting follower count for userID ${userID}: ${errorFollowerCount.message}`);
      return { error: errorFollowerCount };
    }

    // get (recipeID, title, servings, recipeCategoryID, type, lifespanDays, version, status, photoURL) from db.recipes where userID = userID, status = published and deleted = false
    const { data: recipes, error: errorRecipes } = await db.from('recipes').select('recipeID, title, servings, recipeCategoryID, type, lifespanDays, version, status, photoURL').eq('userID', userID).eq('status', 'published').eq('deleted', false);
    if (errorRecipes) {
      global.logger.info(`Error getting recipes for userID ${userID}: ${errorRecipes.message}`);
      return { error: errorRecipes };
    }

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
      recipes,
      timelineEvents: [],
    };
    return result;
  }

  async function getProfile(options) {
    const { userID } = options;
    global.logger.info(`Successfully retrieved profile for userID ${userID}`);
    return retrieveProfile(userID);
  }

  async function getFriends(options) {
    const { userID } = options;

    //get friendshipIDs of userID where deleted = false and status = 'confirmed'
    const { data: friendshipIDs, error } = await db.from('friendships').select('friend').eq('userID', userID).eq('deleted', false).eq('status', 'confirmed');
    if (error) {
      global.logger.info(`Error getting friendshipIDs for userID ${userID}: ${error.message}`);
      return { error };
    }
    if (!friendshipIDs) {
      global.logger.info(`User with userID ${userID} has no friends`);
      return { error: { message: `User with userID ${userID} has no friends` } };
    }

    // Map over friendshipIDs and return a promise for each friend's profile
    const promises = friendshipIDs.map(async (friendship) => {
      try {
        const friendProfile = await retrieveProfile(friendship.friend);
        return friendProfile;
      } catch (error) {
        global.logger.error(`Error retrieving profile for userID ${friendship.friend}: ${error.message}`);
        return null;
      }
    });
    const friendProfiles = await Promise.all(promises);
    const validFriendProfiles = friendProfiles.filter((profile) => profile !== null);

    global.logger.info(`Successfully retrieved ${validFriendProfiles.length} friends for userID ${userID}`);
    return validFriendProfiles;
  }

  async function getFriend(options) {
    const { userID, friendUserID } = options;

    //get friendshipID of userID and friendUserID where deleted = false and status = 'confirmed'
    const { data: friendshipID, error } = await db.from('friendships').select('friendshipID').eq('userID', userID).eq('friend', friendUserID).eq('deleted', false).eq('status', 'confirmed').single();
    if (error) {
      global.logger.info(`Error getting friendshipID for userID ${userID} and friendUserID ${friendUserID}: ${error.message}`);
      return { error };
    }
    if (!friendshipID) {
      global.logger.info(`No friendship found for userID ${userID} and friendUserID ${friendUserID}`);
      return { error: { message: `No friendship found for userID ${userID} and friendUserID ${friendUserID}` } };
    }

    //get friend's profile
    const { data: friendProfile, error: errorFriendProfile } = await retrieveProfile(friendUserID);
    if (errorFriendProfile) {
      global.logger.info(`Error getting profile for userID ${friendUserID}: ${errorFriendProfile.message}`);
      return { error: errorFriendProfile };
    }

    global.logger.info(`Successfully retrieved friend for userID ${userID} and friendUserID ${friendUserID}`);
    return friendProfile;
  }

  async function getFollowers(options) {
    const { userID } = options;

    //get followshipIDs of userID where deleted = false
    const { data: followshipIDs, error } = await db.from('followships').select('userID').eq('following', userID).eq('deleted', false);
    if (error) {
      global.logger.info(`Error getting followshipIDs for userID ${userID}: ${error.message}`);
      return { error };
    }
    if (!followshipIDs) {
      global.logger.info(`No followers found for userID ${userID}`);
      return { error: { message: `No followers found for userID ${userID}` } };
    }

    const promises = followshipIDs.map(async (followship) => {
      try {
        const friendProfile = await retrieveProfile(followship.userID);
        return friendProfile;
      } catch (error) {
        global.logger.error(`Error retrieving profile for userID ${followship.userID}: ${error.message}`);
        return null;
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
      global.logger.info(`Error getting followshipID for userID ${userID} and followerUserID ${followerUserID}: ${error.message}`);
      return { error };
    }
    if (!followshipID) {
      global.logger.info(`No followship found for userID ${userID} and followerUserID ${followerUserID}`);
      return { error: { message: `No followship found for userID ${userID} and followerUserID ${followerUserID}` } };
    }

    //get follower's profile
    const { data: followerProfile, error: errorFollowerProfile } = await retrieveProfile(followerUserID);
    if (errorFollowerProfile) {
      global.logger.info(`Error getting profile for userID ${followerUserID}: ${errorFollowerProfile.message}`);
      return { error: errorFollowerProfile };
    }

    global.logger.info(`Successfully retrieved follower for userID ${userID} and followerUserID ${followerUserID}`);
    return followerProfile;
  }

  return {
    getProfile,
    getFriends,
    getFriend,
    getFollowers,
    getFollower,
  };
};
