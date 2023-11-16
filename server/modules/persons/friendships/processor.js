const { createUserLog } = require('../../../services/dbLogger');

('use strict');

const { updater } = require('../../../db');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, friendshipIDs, name } = options;

    let q = db.from('friendships').select().filter('userID', 'eq', userID).eq('deleted', false).order('friend', { ascending: true });

    if (friendshipIDs) {
      q = q.in('friend', friendshipIDs);
    }

    const { data: friendships, error } = await q;
    for (let friendship of friendships) {
      friendship.match = true;
    }
    if (error) {
      global.logger.info(`Error getting friendships: ${error.message}`);
      return { error: error.message };
    }

    // if 'name' is provided, need to get the 'person' object for every friend.friend and keep it in data only if their first or last name includes 'name'
    if (name) {
      for (let i = 0; i < friendships.length; i++) {
        const { data: person, error: personError } = await db.from('persons').select().eq('personID', friendships[i].friend).single();
        if (personError) {
          global.logger.info(`Error getting person ${friendships[i].friend}: ${personError.message}`);
          return { error: personError.message };
        }
        if (!person.nameFirst.includes(name) && !person.nameLast.includes(name)) {
          friendships[i].match = false;
        }
      }
    }

    //return only matching friendships
    const result = friendships.filter((friendship) => friendship.match);
    global.logger.info(`Got ${result.length} friendships`);
    return result;
  }

  async function getFriendshipByID(options) {
    const { data, error } = await db.from('friendships').select().eq('friendshipID', options.friendshipID).single();

    if (error) {
      global.logger.info(`Error getting friendship ${options.friendshipID}: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got friendship ${options.friendshipID}`);
    return data;
  }

  async function create(options) {
    const { customID, authorization, userID, friend } = options;

    // ensure person exists for friend
    const { data: person, error: personError } = await db.from('persons').select().eq('personID', friend).single();
    if (personError) {
      global.logger.info(`Error getting person ${friend}: ${personError.message}`);
      return { error: personError.message };
    }
    if (!person) {
      global.logger.info(`Person ${friend} does not exist, cannot create friendship`);
      return { error: 'Person does not exist, cannot create friendship' };
    }

    // ensure friendship does not already exist
    const { data: existingFriendship, error: friendshipError } = await db.from('friendships').select().eq('userID', userID).eq('friend', friend).single();
    if (friendshipError) {
      global.logger.info(`Error checking for existing friendship}: ${friendshipError.message}`);
      return { error: friendshipError.message };
    }
    if (existingFriendship) {
      global.logger.info(`Friendship ${existingFriendship.friendshipID} already exists`);
      return { error: 'Friendship already exists' };
    }

    // create friendship
    const { data: friendship, error } = await db.from('friendships').insert({ friendshipID: customID, userID, friend, status: 'requested', version: 1 }).select().single();

    if (error) {
      global.logger.info(`Error creating friendship: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Created friendship ${friendship.friendshipID}`);
    createUserLog(userID, authorization, 'requestedFriendship', friendship.friendshipID, null, null, null, 'requested friendship with: ' + person.nameFirst + ' ' + person.nameLast);
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

    // update friendship status
    try {
      const updatedFriendship = await updater(userID, authorization, 'friendshipID', friendshipID, 'friendships', { status });
      return updatedFriendship;
    } catch (error) {
      global.logger.info(`Error updating friendship ${friendshipID}: ${error.message}`);
      return { error: error.message };
    }
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
    createUserLog(options.userID, options.authorization, 'deleteFriendship', Number(options.friendshipID), null, null, null, `deleted friendship with personID: ${friendship.friend}`);
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
