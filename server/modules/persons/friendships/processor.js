const { createUserLog } = require('../../../services/dbLogger');
const { errorGen } = require('../../../middleware/errorHandling');

('use strict');

const { updater } = require('../../../db');
const { default: axios } = require('axios');

module.exports = ({ db, dbPublic }) => {
  async function getAll(options) {
    const { userID, sourceUserID, friendshipIDs, name } = options;

    try {
      let q;
      // if sourceUserID is not provided, get all of querying user's friendships
      if (!sourceUserID) {
        q = db.from('friendships').select().filter('userID', 'eq', userID).eq('deleted', false).order('friendshipID', { ascending: true });
      } else {
        q = db.from('friendships').select().filter('userID', 'eq', sourceUserID).eq('deleted', false).order('friendshipID', { ascending: true });
      }

      if (friendshipIDs) {
        q = q.in('friendshipID', friendshipIDs);
      }

      const { data: friendships, error } = await q;
      for (let friendship of friendships) {
        friendship.match = true;
      }
      if (error) {
        global.logger.error(`Error getting friendships: ${error.message}`);
        throw errorGen('Error getting friendships', 400);
      }

      // if 'name' is provided, need to get the 'profile' object for every friend.friend and keep it in data only if their first or last name includes 'name'
      if (name) {
        for (let i = 0; i < friendships.length; i++) {
          const { data: profile, error: profileError } = await dbPublic.from('profiles').select().eq('user_id', friendships[i].friend).single();
          if (profileError) {
            global.logger.error(`Error getting profile user_id ${friendships[i].friend}: ${profileError.message}`);
            throw errorGen(`Error getting profile user_id ${friendships[i].friend}`, 400);
          }
          if (!profile.name_first.includes(name) && !profile.name_last.includes(name)) {
            friendships[i].match = false;
          }
        }
      }

      // return only matching friendships
      const result = friendships.filter((friendship) => friendship.match);

      // //enhance the return objects with profile info for each friend
      // const enhancePromises = [];
      // for (let i = 0; i < result.length; i++) {
      //   enhancePromises.push(enhanceFriendship(result[i]));
      // }
      // const enhancedFriendships = await Promise.all(enhancePromises);
      global.logger.info(`Got ${result.length} friendships`);
      return result;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in friendships getAll', err.code || 520, err.name || 'unhandledError_friendships-getAll', err.isOperational || false, err.severity || 2);
    }
  }

  async function getFriendshipByID(options) {
    try {
      const { data, error } = await db.from('friendships').select().eq('friendshipID', options.friendshipID).single();

      if (error) {
        global.logger.error(`Error getting friendship ${options.friendshipID}: ${error.message}`);
        throw errorGen(`Error getting friendship ${options.friendshipID}`, 400);
      }

      global.logger.info(`Got friendship ${options.friendshipID}`);
      return data;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in friendships getFriendshipByID', err.code || 520, err.name || 'unhandledError_friendships-getFriendshipByID', err.isOperational || false, err.severity || 2);
    }
  }

  async function create(options) {
    const { customID, authorization, userID, friend } = options;

    try {
      const status = options.status ? options.status : 'requesting';

      // ensure profile exists for friend
      const { data: profile, error: profileError } = await dbPublic.from('profiles').select().eq('user_id', friend).single();
      if (profileError) {
        global.logger.error(`Error getting profile user_id ${friend}: ${profileError.message}`);
        throw errorGen(`Error getting profile user_id ${friend}`, 400);
      }
      if (!profile) {
        global.logger.error(`Profile for ${friend} does not exist, cannot create friendship`);
        throw errorGen(`Profile for ${friend} does not exist, cannot create friendship`, 400);
      }

      // ensure friendship does not already exist
      const { data: existingFriendship, error: friendshipError } = await db.from('friendships').select().eq('userID', userID).eq('friend', friend);
      if (friendshipError) {
        global.logger.error(`Error checking for existing friendship}: ${friendshipError.message}`);
        throw errorGen(`Error checking for existing friendship`, 400);
      }
      if (existingFriendship.length && existingFriendship[0].deleted === false) {
        global.logger.error(`Friendship ${existingFriendship.friendshipID} already exists`);
      } else if (existingFriendship.length && existingFriendship[0].deleted === true) {
        // reset status of existing friendship to 'requesting', undelete and return
        const { data, error } = await db.from('friendships').update({ deleted: false, status }).eq('friendshipID', existingFriendship[0].friendshipID).select('*').single();
        if (error) {
          global.logger.error(`Error resetting friendship ${existingFriendship[0].friendshipID}: ${error.message}`);
          throw errorGen(`Error resetting friendship ${existingFriendship[0].friendshipID}`, 400);
        }
        global.logger.info(`Reset friendship ${existingFriendship[0].friendshipID}`);
        createUserLog(userID, authorization, 'requestedFriendship', existingFriendship[0].friendshipID, null, null, null, 'requested friendship with: ' + profile.name_first + ' ' + profile.name_last);
        if (status === 'receivedRequest') {
          // add app message 'newFriendRequest' for row
          await db.from('friendships').update({ appMessageStatusNewFriendRequest: 'notAcked', appMessageDateNewFriendRequest: new Date() }).eq('friendshipID', existingFriendship[0].friendshipID);
        }
        // need to call function again, creating inverse of friendship request ONLY if status is 'requesting'
        if (status === 'requesting') {
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
            global.logger.error(`Error creating inverse friendship: ${inverseFriendshipError.message}`);
            throw errorGen(`Error creating inverse friendship`, 400);
          }
        }
        return {
          friendshipID: data.friendshipID,
          status: data.status,
          friend: data.friend,
          userID: data.userID,
          version: data.version,
        };
      }

      // create friendship
      const { data: friendship, error } = await db
        .from('friendships')
        .insert({ friendshipID: customID, userID, friend, status: status === 'confirmedInverse' ? 'confirmed' : status, version: 1 })
        .select('*')
        .single();

      if (error) {
        global.logger.error(`Error creating friendship: ${error.message}`);
        throw errorGen('Error creating friendship', 400);
      }
      global.logger.info(`Created friendship ${friendship.friendshipID}`);
      if (status === 'requesting') {
        createUserLog(userID, authorization, 'requestedFriendship', friendship.friendshipID, null, null, null, 'requested friendship with: ' + profile.name_first + ' ' + profile.name_last);
      } else if (status === 'receivedRequest') {
        // add app message 'newFriendRequest' for row
        await db.from('friendships').update({ appMessageStatusNewFriendRequest: 'notAcked', appMessageDateNewFriendRequest: new Date() }).eq('friendshipID', friendship.friendshipID);

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
          global.logger.error(`Error creating inverse friendship: ${error.message}`);
          //rollback friendship creation
          const { error } = await db.from('friendships').delete().eq('friendshipID', friendship.friendshipID);
          if (error) {
            global.logger.error(`Error rolling back friendship creation: ${error.message}`);
            throw errorGen(`Error rolling back friendship creation`, 400);
          }
          throw errorGen(`Error creating inverse friendship`, 400);
        }
        return inverseFriendship;
      }
      if (status === 'confirmed') {
        // need to call function again, creating inverse of friendship request
        const { data: inverseFriendship, error } = await axios.post(
          `${process.env.NODE_HOST}:${process.env.PORT}/persons/friendships`,
          {
            userID: friend,
            friend: userID,
            status: 'confirmedInverse',
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
          global.logger.error(`Error creating inverse friendship: ${error.message}`);
          //rollback friendship creation
          const { error } = await db.from('friendships').delete().eq('friendshipID', friendship.friendshipID);
          if (error) {
            global.logger.error(`Error rolling back friendship creation: ${error.message}`);
            throw errorGen(`Error rolling back friendship creation`, 400);
          }
          throw errorGen(`Error creating inverse friendship`, 400);
        }
        return inverseFriendship;
      }
      return {
        friendshipID: friendship.friendshipID,
        status: friendship.status,
        friend: friendship.friend,
        userID: friendship.userID,
        version: friendship.version,
      };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in friendships create', err.code || 520, err.name || 'unhandledError_friendships-create', err.isOperational || false, err.severity || 2);
    }
  }

  async function notifyNewFriend(friendshipID) {
    try {
      // get friendship
      const { data: friendship, error: friendshipError } = await db.from('friendships').select().eq('friendshipID', friendshipID).single();
      if (friendshipError) {
        global.logger.error(`Error getting friendship ${friendshipID}: ${friendshipError.message}`);
        throw errorGen(`Error getting friendship ${friendshipID}`, 400);
      }
      if (!friendship) {
        global.logger.error(`Friendship ${friendshipID} does not exist`);
        throw errorGen(`Friendship ${friendshipID} does not exist`, 400);
      }

      // add app message 'newFriend' for row
      if (friendship.status === 'requesting') {
        await db.from('friendships').update({ appMessageStatusNewFriend: 'notAcked', appMessageDateNewFriend: new Date() }).eq('friendshipID', friendshipID);
      }
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in friendships notifyNewFriend', err.code || 520, err.name || 'unhandledError_friendships-notifyNewFriend', err.isOperational || false, err.severity || 2);
    }
  }

  async function update(options) {
    const { userID, friendshipID, status, authorization } = options;

    try {
      if (status === 'confirmed') {
        notifyNewFriend(friendshipID);
      }

      // ensure friendship exists
      const { data: friendship, error: friendshipError } = await db.from('friendships').select().eq('friendshipID', friendshipID).single();
      if (friendshipError) {
        global.logger.error(`Error getting friendship ${friendshipID}: ${friendshipError.message}`);
        throw errorGen(`Error getting friendship ${friendshipID}`, 400);
      }
      if (!friendship) {
        global.logger.error(`Friendship ${friendshipID} does not exist`);
        throw errorGen(`Friendship ${friendshipID} does not exist`, 400);
      }

      let updatedFriendship;
      // update friendship status
      try {
        updatedFriendship = await updater(userID, authorization, 'friendshipID', friendshipID, 'friendships', { status });
      } catch (error) {
        global.logger.error(`Error updating friendship ${friendshipID}: ${error.message}`);
        throw errorGen(`Error updating friendship ${friendshipID}`, 400);
      }

      if (status === 'confirmed') {
        createUserLog(userID, authorization, 'confirmedFriendship', friendship.friendshipID, null, null, null, 'Now friends with ' + friendship.friend);
      }

      // get inverse friendship
      const { data: inverseFriendship, error: inverseFriendshipError } = await db.from('friendships').select().eq('friend', userID).eq('userID', friendship.friend).single();
      if (inverseFriendshipError) {
        global.logger.error(`Error getting inverse friendship for user ${userID}: ${inverseFriendshipError.message}`);
        throw errorGen(`Error getting inverse friendship for user ${userID}`, 400);
      }
      if (!inverseFriendship) {
        global.logger.error(`Inverse friendship for user ${userID} does not exist`);
        throw errorGen(`Inverse friendship for user ${userID} does not exist`, 400);
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
          global.logger.error(`Error updating inverse friendship ${inverseFriendship.friendshipID}: ${error.message}`);
          throw errorGen(`Error updating inverse friendship ${inverseFriendship.friendshipID}`, 400);
        }
      }

      return updatedFriendship;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in friendships update', err.code || 520, err.name || 'unhandledError_friendships-update', err.isOperational || false, err.severity || 2);
    }
  }

  async function deleteFriendship(options) {
    try {
      // ensure friendship exists
      const { data: friendship, error: friendshipError } = await db.from('friendships').select().eq('friendshipID', options.friendshipID).single();
      if (friendshipError) {
        global.logger.error(`Error getting friendship ${options.friendshipID}: ${friendshipError.message}`);
        throw errorGen(`Error getting friendship ${options.friendshipID}`, 400);
      }
      if (!friendship) {
        global.logger.error(`Friendship ${options.friendshipID} does not exist`);
        throw errorGen(`Friendship ${options.friendshipID} does not exist`, 400);
      }

      // delete friendship
      const { data, error } = await db.from('friendships').update({ deleted: true }).eq('friendshipID', options.friendshipID);
      if (error) {
        global.logger.error(`Error deleting friendship ${options.friendshipID}: ${error.message}`);
        throw errorGen(`Error deleting friendship ${options.friendshipID}`, 400);
      }

      //add a 'deleted' log entry
      createUserLog(options.userID, options.authorization, 'deleteFriendship', Number(options.friendshipID), null, null, null, `deleted friendship with user_id: ${friendship.friend}`);

      //get inverse friendship
      const { data: inverseFriendship, error: inverseFriendshipError } = await db.from('friendships').select().eq('friend', options.userID).eq('userID', friendship.friend);
      if (inverseFriendshipError) {
        global.logger.error(`Error getting inverse friendship for user ${options.userID}: ${inverseFriendshipError.message}`);
        throw errorGen(`Error getting inverse friendship for user ${options.userID}`, 400);
      }
      if (!inverseFriendship.length) {
        global.logger.error(`Inverse friendship for user ${options.userID} does not exist`);
        throw errorGen(`Inverse friendship for user ${options.userID} does not exist`, 400);
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
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in friendships deleteFriendship', err.code || 520, err.name || 'unhandledError_friendships-deleteFriendship', err.isOperational || false, err.severity || 2);
    }
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
