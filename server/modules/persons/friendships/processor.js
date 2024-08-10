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
        throw errorGen(`*friendships-getAll* Error getting friendships: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      // if 'name' is provided, need to get the 'profile' object for every friend.friend and keep it in data only if their first or last name includes 'name'
      if (name) {
        for (let i = 0; i < friendships.length; i++) {
          const { data: profile, error: profileError } = await dbPublic.from('profiles').select().eq('user_id', friendships[i].friend).single();
          if (profileError) {
            throw errorGen(`*friendships-getAll* Error getting profile user_id ${friendships[i].friend}: ${profileError.message}`, 511, 'failSupabaseSelect', true, 3);
          }
          if (!profile.name_first.includes(name) && !profile.name_last.includes(name)) {
            friendships[i].match = false;
          }
        }
      }

      // return only matching friendships
      const result = friendships.filter((friendship) => friendship.match);

      global.logger.info({ message: `*friendships-getAll* Got ${result.length} friendships`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return result;
    } catch (err) {
      throw errorGen(err.message || '*friendships-getAll* Unhandled Error', err.code || 520, err.name || 'unhandledError_friendships-getAll', err.isOperational || false, err.severity || 2);
    }
  }

  async function getFriendshipByID(options) {
    try {
      const { data, error } = await db.from('friendships').select().eq('friendshipID', options.friendshipID).single();

      if (error) {
        throw errorGen(`*friendships-getFriendshipByID* Error getting friendship ${options.friendshipID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      global.logger.info({ message: `*friendships-getFriendshipByID* Got friendship ${options.friendshipID}`, level: 6, timestamp: new Date().toISOString(), userID: data.userID });
      return data;
    } catch (err) {
      throw errorGen(err.message || '*friendships-getFriendshipByID* Unhandled Error', err.code || 520, err.name || 'unhandledError_friendships-getFriendshipByID', err.isOperational || false, err.severity || 2);
    }
  }

  async function create(options) {
    const { customID, authorization, userID, friend } = options;

    try {
      const status = options.status ? options.status : 'requesting';

      // ensure profile exists for friend
      const { data: profile, error: profileError } = await dbPublic.from('profiles').select().eq('user_id', friend).single();
      if (profileError) {
        throw errorGen(`*friendships-create* Error getting profile user_id ${friend}: ${profileError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!profile) {
        throw errorGen(`*friendships-create* Profile for ${friend} does not exist, cannot create friendship`, 515, 'cannotComplete', false, 3);
      }

      // ensure friendship does not already exist
      const { data: existingFriendship, error: friendshipError } = await db.from('friendships').select().eq('userID', userID).eq('friend', friend);
      if (friendshipError) {
        throw errorGen(`*friendships-create* Error checking for existing friendship}: ${friendshipError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingFriendship.length && existingFriendship[0].deleted === false) {
        global.logger.info({ message: `*friendships-create* Friendship ${existingFriendship.friendshipID} already exists, trying to undelete`, level: 6, timestamp: new Date().toISOString(), userID: 0 });
      } else if (existingFriendship.length && existingFriendship[0].deleted === true) {
        // reset status of existing friendship to 'requesting', undelete and return
        const { data, error } = await db.from('friendships').update({ deleted: false, status }).eq('friendshipID', existingFriendship[0].friendshipID).select('*').single();
        if (error) {
          throw errorGen(`*friendships-create* Error resetting friendship ${existingFriendship[0].friendshipID}: ${error.message}`, 513, 'failSupabaseUpdate', true, 3);
        }
        global.logger.info({ message: `*friendships-create* Reset friendship ${existingFriendship[0].friendshipID}`, level: 6, timestamp: new Date().toISOString(), userID: 0 });
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
            throw errorGen(`*friendships-create* Error creating inverse friendship: ${inverseFriendshipError.message}`, 515, 'cannotComplete', false, 3);
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
        throw errorGen(`*friendships-create* Error creating friendship: ${error.message}`, 512, 'failSupabaseInsert', true, 3);
      }
      global.logger.info({ message: `*friendships-create* created friendship ${friendship.friendshipID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
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
          global.logger.info({ message: `*friendships-create* Error creating inverse friendship: ${error.message}, rolling back`, level: 3, timestamp: new Date().toISOString(), userID: userID });
          //rollback friendship creation
          const { error } = await db.from('friendships').delete().eq('friendshipID', friendship.friendshipID);
          if (error) {
            throw errorGen(`*friendships-create* Error rolling back friendship creation: ${error.message}`, 514, 'failSupabaseDelete', true, 2);
          }
          throw errorGen(`*friendships-create* Error creating inverse friendship: ${error.message}, rolled back`, 515, 'cannotComplete', false, 3);
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
          global.logger.info({ message: `*friendships-create* Error creating inverse friendship: ${error.message}, rolling back`, level: 3, timestamp: new Date().toISOString(), userID: userID });
          //rollback friendship creation
          const { error } = await db.from('friendships').delete().eq('friendshipID', friendship.friendshipID);
          if (error) {
            throw errorGen(`*friendships-create* Error rolling back friendship creation: ${error.message}`, 514, 'failSupabaseDelete', true, 2);
          }
          throw errorGen(`*friendships-create* Error rolling back friendship creation: ${error.message}, rolled back`, 515, 'cannotComplete', false, 3);
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
      throw errorGen(err.message || '*friendships-create* Unhandled Error', err.code || 520, err.name || 'unhandledError_friendships-create', err.isOperational || false, err.severity || 2);
    }
  }

  async function notifyNewFriend(friendshipID) {
    try {
      // get friendship
      const { data: friendship, error: friendshipError } = await db.from('friendships').select().eq('friendshipID', friendshipID).single();
      if (friendshipError) {
        throw errorGen(`*friendships-notifyNewFriend* Error getting friendship ${friendshipID}: ${friendshipError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!friendship) {
        throw errorGen(`*friendships-notifyNewFriend* Friendship ${friendshipID} does not exist, cannot notifyNewFriend`, 515, 'cannotComplete', false, 3);
      }

      // add app message 'newFriend' for row
      if (friendship.status === 'requesting') {
        await db.from('friendships').update({ appMessageStatusNewFriend: 'notAcked', appMessageDateNewFriend: new Date() }).eq('friendshipID', friendshipID);
      }
    } catch (err) {
      throw errorGen(err.message || '*friendships-notifyNewFriend* Unhandled Error', err.code || 520, err.name || 'unhandledError_friendships-notifyNewFriend', err.isOperational || false, err.severity || 2);
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
        throw errorGen(`*friendships-update* Error getting friendship ${friendshipID}: ${friendshipError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!friendship) {
        throw errorGen(`*friendships-update* Friendship ${friendshipID} does not exist, cannot update`, 515, 'cannotComplete', false, 3);
      }

      let updatedFriendship;
      // update friendship status
      try {
        updatedFriendship = await updater(userID, authorization, 'friendshipID', friendshipID, 'friendships', { status });
      } catch (error) {
        throw errorGen(`*friendships-update* Error updating friendship ${friendshipID}: ${error.message}`, 515, 'cannotComplete', false, 3);
      }

      if (status === 'confirmed') {
        createUserLog(userID, authorization, 'confirmedFriendship', friendship.friendshipID, null, null, null, 'Now friends with ' + friendship.friend);
      }

      // get inverse friendship
      const { data: inverseFriendship, error: inverseFriendshipError } = await db.from('friendships').select().eq('friend', userID).eq('userID', friendship.friend).single();
      if (inverseFriendshipError) {
        throw errorGen(`*friendships-update* Error getting inverse friendship for user ${userID}: ${inverseFriendshipError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!inverseFriendship) {
        throw errorGen(`*friendships-update* Inverse friendship for user ${userID} does not exist, cannot update`, 515, 'cannotComplete', false, 3);
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
          throw errorGen(error.message || '*friendships-update* Unhandled Error', error.code || 520, error.name || 'unhandledError_friendships-update', error.isOperational || false, error.severity || 2);
        }
      }

      return updatedFriendship;
    } catch (err) {
      throw errorGen(err.message || '*friendships-update* Unhandled Error', err.code || 520, err.name || 'unhandledError_friendships-update', err.isOperational || false, err.severity || 2);
    }
  }

  async function deleteFriendship(options) {
    try {
      // ensure friendship exists
      const { data: friendship, error: friendshipError } = await db.from('friendships').select().eq('friendshipID', options.friendshipID).single();
      if (friendshipError) {
        throw errorGen(`*friendships-deleteFriendship* Error getting friendship ${options.friendshipID}: ${friendshipError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!friendship) {
        throw errorGen(`*friendships-deleteFriendship* Friendship ${options.friendshipID} does not exist, cannot delete`, 515, 'cannotComplete', false, 3);
      }

      // delete friendship
      const { data, error } = await db.from('friendships').update({ deleted: true }).eq('friendshipID', options.friendshipID);
      if (error) {
        throw errorGen(`*friendships-deleteFriendship* Error deleting friendship ${options.friendshipID}: ${error.message}`, 513, 'failSupabaseUpdate', true, 3);
      }

      //add a 'deleted' log entry
      createUserLog(options.userID, options.authorization, 'deleteFriendship', Number(options.friendshipID), null, null, null, `deleted friendship with user_id: ${friendship.friend}`);

      //get inverse friendship
      const { data: inverseFriendship, error: inverseFriendshipError } = await db.from('friendships').select().eq('friend', options.userID).eq('userID', friendship.friend);
      if (inverseFriendshipError) {
        throw errorGen(`*friendships-deleteFriendship* Error getting inverse friendship for user ${options.userID}: ${inverseFriendshipError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!inverseFriendship.length) {
        throw errorGen(`*friendships-deleteFriendship* Inverse friendship for user ${options.userID} does not exist, cannot createUserLog`, 515, 'cannotComplete', false, 3);
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
          throw errorGen(error.message || `*friendships-deleteFriendship* Error deleting inverse friendship ${inverseFriendship[0].friendshipID}: ${error.message}`, error.code || 520, error.name || 'unhandledError_friendships-deleteFriendship', error.isOperational || false, error.severity || 2);
        }
      }
      return data;
    } catch (err) {
      throw errorGen(err.message || '*friendships-deleteFriendship* Unhandled Error', err.code || 520, err.name || 'unhandledError_friendships-deleteFriendship', err.isOperational || false, err.severity || 2);
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
