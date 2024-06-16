const { createUserLog } = require('../../../services/dbLogger');
const { errorGen } = require('../../../middleware/errorHandling');

('use strict');

module.exports = ({ db, dbPublic }) => {
  async function getAll(options) {
    const { userID, followshipIDs, name } = options;

    try {
      let q = db.from('followships').select().filter('userID', 'eq', userID).eq('deleted', false).order('followshipID', { ascending: true });

      if (followshipIDs) {
        q = q.in('followshipID', followshipIDs);
      }

      const { data: followships, error } = await q;
      for (let followship of followships) {
        followship.match = true;
      }
      if (error) {
        global.logger.error(`Error getting followships: ${error.message}`);
        throw errorGen('Error getting followships', 400);
      }

      // if 'name' is provided, need to get the 'profile object for every followship.following and keep in data only if thier first or last name includes 'name'
      if (name) {
        for (let i = 0; i < followships.length; i++) {
          const followship = followships[i];
          const { data: profile, profileError } = await dbPublic.from('profiles').select().eq('user_id', followship.following).single();
          if (profileError) {
            global.logger.error(`Error getting profile user_id ${followship[i].following}: ${profileError.message}`);
            throw errorGen(`Error getting profile user_id ${followship[i].following}`, 400);
          }
          if (!profile.name_first.includes(name) && !profile.name_last.includes(name)) {
            followship.match = false;
          }
        }
      }

      //return only matching followships
      const result = followships.filter((followship) => followship.match);
      global.logger.info(`Got ${result.length} followships`);
      return result;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in followships getAll', err.code || 520, err.name || 'unhandledError_followships-getAll', err.isOperational || false, err.severity || 2);
    }
  }

  async function getAllFollowers(options) {
    const { userID, limit } = options;

    try {
      let q = db.from('followships').select().filter('following', 'eq', userID).eq('deleted', false).order('followshipID', { ascending: true });

      if (limit) {
        q = q.limit(limit);
      }

      const { data: followships, error } = await q;
      if (error) {
        global.logger.error(`Error getting follower followships: ${error.message}`);
        throw errorGen('Error getting follower followships', 400);
      }

      global.logger.info(`Got ${followships.length} follower followships`);
      return followships;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in followships getAllFollowers', err.code || 520, err.name || 'unhandledError_followships-getAllFollowers', err.isOperational || false, err.severity || 2);
    }
  }

  async function getFollowshipByID(options) {
    try {
      const { data, error } = await db.from('followships').select().eq('followshipID', options.followshipID).single();

      if (error) {
        global.logger.error(`Error getting followship ${options.followshipID}: ${error.message}`);
        throw errorGen(`Error getting followship ${options.followshipID}`, 400);
      }
      global.logger.info(`Got followship ${options.followshipID}`);
      return data;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in followships getFollowshipByID', err.code || 520, err.name || 'unhandledError_followships-getFollowshipByID', err.isOperational || false, err.severity || 2);
    }
  }

  async function create(options) {
    const { customID, authorization, userID, following } = options;

    try {
      // ensure profile exists for following
      const { data: profile, profileError } = await dbPublic.from('profiles').select().eq('user_id', following).single();
      if (profileError) {
        global.logger.error(`Error getting profile user_id ${following}: ${profileError.message}`);
        throw errorGen(`Error getting profile user_id ${following}`, 400);
      }
      if (!profile) {
        global.logger.error(`Profile user_id ${following} does not exist`);
        throw errorGen(`Profile user_id ${following} does not exist`, 400);
      }

      // ensure followship does not already exist
      const { data: existingFollowship, existingFollowshipError } = await db.from('followships').select().eq('userID', userID).eq('following', following);
      if (existingFollowshipError) {
        global.logger.error(`Error checking for existing followship: ${existingFollowshipError.message}`);
        throw errorGen('Error checking for existing followship', 400);
      }
      if (existingFollowship.length && existingFollowship[0].deleted === false) {
        global.logger.error(`Followship already exists`);
        throw errorGen('Followship already exists', 400);
      } else if (existingFollowship.length && existingFollowship[0].deleted === true) {
        // if followship exists but is deleted, undelete it
        const { data: undelete, undeleteError } = await db.from('followships').update({ deleted: false, appMessageStatus: 'notAcked', appMessageDate: new Date() }).eq('followshipID', existingFollowship[0].followshipID).select('*').single();
        if (undeleteError) {
          global.logger.error(`Error undeleting followship ${existingFollowship[0].followshipID}: ${undeleteError.message}`);
          throw errorGen(`Error undeleting followship ${existingFollowship[0].followshipID}`, 400);
        }
        global.logger.info(`Undeleted followship ${existingFollowship[0].followshipID}`);
        createUserLog(userID, authorization, 'createdFollowship', existingFollowship[0].followshipID, null, null, null, 'Now following ' + profile.name_first + ' ' + profile.name_last);
        return {
          followshipID: undelete.followshipID,
          userID: undelete.userID,
          following: undelete.following,
        };
      }

      // create followship
      const { data: followship, error } = await db.from('followships').insert({ followshipID: customID, userID, following, deleted: false, appMessageStatus: 'notAcked', appMessageDate: new Date() }).select('*').single();
      if (error) {
        global.logger.error(`Error creating followship: ${error.message}`);
        throw errorGen('Error creating followship', 400);
      }
      global.logger.info(`Created followship ${customID}`);
      createUserLog(userID, authorization, 'createdFollowship', followship.followshipID, null, null, null, 'Now following ' + profile.name_first + ' ' + profile.name_last);
      return {
        followshipID: followship.followshipID,
        userID: followship.userID,
        following: followship.following,
      };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in followships create', err.code || 520, err.name || 'unhandledError_followships-create', err.isOperational || false, err.severity || 2);
    }
  }

  async function deleteFollowship(options) {
    try {
      // ensure followship exists
      const { data: followship, error } = await db.from('followships').select().eq('followshipID', options.followshipID).single();
      if (error) {
        global.logger.error(`Error getting followship ${options.followshipID}: ${error.message}`);
        throw errorGen(`Error getting followship ${options.followshipID}`, 400);
      }
      if (!followship) {
        global.logger.error(`Followship ${options.followshipID} does not exist`);
        throw errorGen(`Followship ${options.followshipID} does not exist`, 400);
      }

      // delete followship
      const { data, error: deleteError } = await db.from('followships').update({ deleted: true }).eq('followshipID', options.followshipID);
      if (deleteError) {
        global.logger.error(`Error deleting followship ${options.followshipID}: ${deleteError.message}`);
        throw errorGen(`Error deleting followship ${options.followshipID}`, 400);
      }
      global.logger.info(`Deleted followship ${options.followshipID}`);
      createUserLog(options.userID, options.authorization, 'deletedFollowship', Number(options.followshipID), null, null, null, 'No longer followng ' + followship.following);
      return data;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in followships deleteFollowship', err.code || 520, err.name || 'unhandledError_followships-deleteFollowship', err.isOperational || false, err.severity || 2);
    }
  }

  return {
    create,
    delete: deleteFollowship,
    get: {
      followers: getAllFollowers,
      all: getAll,
      by: {
        ID: getFollowshipByID,
      },
    },
  };
};
