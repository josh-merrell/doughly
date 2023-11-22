const { createUserLog } = require('../../../services/dbLogger');

('use strict');

const { updater } = require('../../../db');
const { default: axios } = require('axios');

module.exports = ({ db, dbPublic }) => {
  async function getAll(options) {
    const { userID, friendshipIDs, name } = options;

    let q = db.from('friendships').select().filter('userID', 'eq', userID).eq('deleted', false).order('friendshipID', { ascending: true });

    if (friendshipIDs) {
      q = q.in('friendshipID', friendshipIDs);
    }

    const { data: friendships, error } = await q;
    for (let friendship of friendships) {
      friendship.match = true;
    }
    if (error) {
      global.logger.info(`Error getting friendships: ${error.message}`);
      return { error: error.message };
    }

    // if 'name' is provided, need to get the 'profile' object for every friend.friend and keep it in data only if their first or last name includes 'name'
    if (name) {
      for (let i = 0; i < friendships.length; i++) {
        const { data: profile, error: profileError } = await dbPublic.from('profiles').select().eq('user_id', friendships[i].friend).single();
        if (profileError) {
          global.logger.info(`Error getting profile user_id ${friendships[i].friend}: ${profileError.message}`);
          return { error: profileError.message };
        }
        if (!profile.name_first.includes(name) && !profile.name_last.includes(name)) {
          friendships[i].match = false;
        }
      }
    }

    //return only matching friendships
    const result = friendships.filter((friendship) => friendship.match);

    //enhance the return objects with profile info for each friend
    const enhancePromises = [];
    for (let i = 0; i < result.length; i++) {
      enhancePromises.push(enhanceFriendship(result[i]));
    }
    const enhancedFriendships = await Promise.all(enhancePromises);
    global.logger.info(`Got ${enhancedFriendships.length} friendships`);
    return enhancedFriendships;
  }

  async function enhanceFriendship(friendship) {
    //add profile info for friend
    const { data: profile, error: profileError } = await dbPublic.from('profiles').select().eq('user_id', friendship.friend).single();
    if (profileError) {
      global.logger.info(`Error getting profile user_id ${friendship.friend}: ${profileError.message}`);
      return { error: profileError.message };
    }
    friendship.friendNameFirst = profile.name_first;
    friendship.friendNameLast = profile.name_last;
    friendship.friendUsername = profile.username;
    friendship.friendPhotoURL = profile.photo_url;
    friendship.friendJoinDate = profile.joined_at;

    //add recipe count for friend
    const { data: recipeCount, error: recipeCountError } = await db.from('recipes').select('recipeID').eq('userID', friendship.friend);
    if (recipeCountError) {
      global.logger.info(`Error getting recipe count for user ${friendship.friend}: ${recipeCountError.message}`);
      return { error: recipeCountError.message };
    }
    friendship.friendRecipeCount = recipeCount.length;

    return friendship;
  }

  async function getFriendshipByID(options) {
    const { data, error } = await db.from('friendships').select().eq('friendshipID', options.friendshipID).single();

    if (error) {
      global.logger.info(`Error getting friendship ${options.friendshipID}: ${error.message}`);
      return { error: error.message };
    }
    //enhance friendship with extra properties
    const enhancedFriendship = await enhanceFriendship(data);

    global.logger.info(`Got friendship ${options.friendshipID}`);
    return enhancedFriendship;
  }

  async function create(options) {
    const { customID, authorization, userID, friend } = options;
    const status = options.status ? options.status : 'requesting';

    // ensure profile exists for friend
    const { data: profile, error: profileError } = await dbPublic.from('profiles').select().eq('user_id', friend).single();
    if (profileError) {
      global.logger.info(`Error getting profile user_id ${friend}: ${profileError.message}`);
      return { error: profileError.message };
    }
    if (!profile) {
      global.logger.info(`Profile for ${friend} does not exist, cannot create friendship`);
      return { error: 'Profile for friend does not exist, cannot create friendship' };
    }

    // ensure friendship does not already exist
    const { data: existingFriendship, error: friendshipError } = await db.from('friendships').select().eq('userID', userID).eq('friend', friend);
    if (friendshipError) {
      global.logger.info(`Error checking for existing friendship}: ${friendshipError.message}`);
      return { error: friendshipError.message };
    }
    if (existingFriendship.length && existingFriendship[0].deleted === false) {
      global.logger.info(`Friendship ${existingFriendship.friendshipID} already exists`);
      return { error: 'Friendship already exists' };
    } else if (existingFriendship.length && existingFriendship[0].deleted === true) {
      // reset status of existing friendship to 'requesting', undelete and return
      const { data, error } = await db.from('friendships').update({ deleted: false, status }).eq('friendshipID', existingFriendship[0].friendshipID);
      if (error) {
        global.logger.info(`Error resetting friendship ${existingFriendship[0].friendshipID}: ${error.message}`);
        return { error: error.message };
      }
      global.logger.info(`Reset friendship ${existingFriendship[0].friendshipID}`);
      createUserLog(userID, authorization, 'requestedFriendship', existingFriendship[0].friendshipID, null, null, null, 'requested friendship with: ' + profile.name_first + ' ' + profile.name_last);
      // need to call function again, creating inverse of friendship request
      const { error: inverseFriendshipError } = await axios.post(
        `${process.env.NODE_HOST}:${process.env.PORT}/persons/friendships`,
        {
          userID: friend,
          friend: userID,
          status: 'receivedRequest',
          IDtype: 23,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: 'override',
          },
        },
      );
      if (inverseFriendshipError) {
        global.logger.info(`Error creating inverse friendship: ${inverseFriendshipError.message}`);
        return { error: inverseFriendshipError.message };
      }
      return data;
    }

    // create friendship
    const { data: friendship, error } = await db.from('friendships').insert({ friendshipID: customID, userID, friend, status, version: 1 }).select().single();

    if (error) {
      global.logger.info(`Error creating friendship: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Created friendship ${friendship.friendshipID}`);
    if (status === 'requesting') {
      createUserLog(userID, authorization, 'requestedFriendship', friendship.friendshipID, null, null, null, 'requested friendship with: ' + profile.name_first + ' ' + profile.name_last);
    } else if (status === 'receivedRequest') {
      createUserLog(userID, authorization, 'receivedFriendship', friendship.friendshipID, null, null, null, 'received friendship request from: ' + profile.name_first + ' ' + profile.name_last);
    }

    if (status === 'requesting') {
      // need to call function again, creating inverse of friendship request
      const { data: inverseFriendship, error } = await axios.post(
        `${process.env.NODE_HOST}:${process.env.PORT}/persons/friendships`,
        {
          userID: friend,
          friend: userID,
          status: 'receivedRequest',
          IDtype: 23,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: 'override',
          },
        },
      );
      if (error) {
        global.logger.info(`Error creating inverse friendship: ${error.message}`);
        //rollback friendship creation
        const { error } = await db.from('friendships').delete().eq('friendshipID', friendship.friendshipID);
        if (error) {
          global.logger.info(`Error rolling back friendship creation: ${error.message}`);
          return { error: error.message };
        }
        return { error: error.message };
      }
      return inverseFriendship;
    }
    return friendship;
  }

  async function update(options) {
    const { userID, friendshipID, status, authorization } = options;

    // ensure friendship exists
    const { data: friendship, error: friendshipError } = await db.from('friendships').select().eq('friendshipID', friendshipID).single();
    if (friendshipError) {
      global.logger.info(`Error getting friendship ${friendshipID}: ${friendshipError.message}`);
      return { error: friendshipError.message };
    }
    if (!friendship) {
      global.logger.info(`Friendship ${friendshipID} does not exist`);
      return { error: 'Friendship does not exist' };
    }

    let updatedFriendship;
    // update friendship status
    try {
      updatedFriendship = await updater(userID, authorization, 'friendshipID', friendshipID, 'friendships', { status });
    } catch (error) {
      global.logger.info(`Error updating friendship ${friendshipID}: ${error.message}`);
      return { error: error.message };
    }

    // get inverse friendship
    const { data: inverseFriendship, error: inverseFriendshipError } = await db.from('friendships').select().eq('friend', userID).eq('userID', friendship.friend).single();
    if (inverseFriendshipError) {
      global.logger.info(`Error getting inverse friendship for user ${userID}: ${inverseFriendshipError.message}`);
      return { error: inverseFriendshipError.message };
    }
    if (!inverseFriendship) {
      global.logger.info(`Inverse friendship for user ${userID} does not exist`);
      return { error: 'Inverse friendship does not exist' };
    }

    // update inverse friendship status if necessary
    if (inverseFriendship.status !== 'confirmed' && status === 'confirmed') {
      const { error } = await axios.patch(
        `${process.env.NODE_HOST}:${process.env.PORT}/persons/friendships/${inverseFriendship.friendshipID}`,
        {
          userID: friendship.friend,
          status: 'confirmed',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: 'override',
          },
        },
      );
      if (error) {
        global.logger.info(`Error updating inverse friendship ${inverseFriendship.friendshipID}: ${error.message}`);
        return { error: error.message };
      }
    }

    return updatedFriendship;
  }

  async function deleteFriendship(options) {
    // ensure friendship exists
    const { data: friendship, error: friendshipError } = await db.from('friendships').select().eq('friendshipID', options.friendshipID).single();
    if (friendshipError) {
      global.logger.info(`Error getting friendship ${options.friendshipID}: ${friendshipError.message}`);
      return { error: friendshipError.message };
    }
    if (!friendship) {
      global.logger.info(`Friendship ${options.friendshipID} does not exist`);
      return { error: 'Friendship does not exist' };
    }

    // delete friendship
    const { data, error } = await db.from('friendships').update({ deleted: true }).eq('friendshipID', options.friendshipID);
    if (error) {
      global.logger.info(`Error deleting friendship ${options.friendshipID}: ${error.message}`);
      return { error: error.message };
    }

    //add a 'deleted' log entry
    createUserLog(options.userID, options.authorization, 'deleteFriendship', Number(options.friendshipID), null, null, null, `deleted friendship with user_id: ${friendship.friend}`);

    //get inverse friendship
    const { data: inverseFriendship, error: inverseFriendshipError } = await db.from('friendships').select().eq('friend', options.userID).eq('userID', friendship.friend);
    if (inverseFriendshipError) {
      global.logger.info(`Error getting inverse friendship for user ${options.userID}: ${inverseFriendshipError.message}`);
      return { error: inverseFriendshipError.message };
    }
    if (!inverseFriendship.length) {
      global.logger.info(`Inverse friendship for user ${options.userID} does not exist`);
      return { error: 'Inverse friendship does not exist' };
    }

    // delete inverse friendship if 'deleted' is false
    if (!inverseFriendship[0].deleted) {
      const { error } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/persons/friendships/${inverseFriendship[0].friendshipID}`, {
        data: {
          userID: friendship.friend,
        },
        headers: {
          'Content-Type': 'application/json',
          authorization: 'override',
        },
      });
      if (error) {
        global.logger.info(`Error deleting inverse friendship ${inverseFriendship[0].friendshipID}: ${error.message}`);
        return { error: error.message };
      }
    }
    return data;
  }

  return {
    create,
    update,
    delete: deleteFriendship,
    get: {
      by: {
        ID: getFriendshipByID,
      },
      all: getAll,
    },
  };
};
