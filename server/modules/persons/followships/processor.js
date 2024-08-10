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
        throw errorGen(`Error getting followships: ${error.message}`, 400, 'failSupabaseSelect', true, 3);
      }

      // if 'name' is provided, need to get the 'profile object for every followship.following and keep in data only if thier first or last name includes 'name'
      if (name) {
        for (let i = 0; i < followships.length; i++) {
          const followship = followships[i];
          const { data: profile, profileError } = await dbPublic.from('profiles').select().eq('user_id', followship.following).single();
          if (profileError) {
            throw errorGen(`Error getting profile user_id ${followship[i].following}: ${profileError.message}`, 511, 'failSupabaseSelect', true, 3);
          }
          if (!profile.name_first.includes(name) && !profile.name_last.includes(name)) {
            followship.match = false;
          }
        }
      }

      //return only matching followships
      const result = followships.filter((followship) => followship.match);
      global.logger.info({ message: `*followships-getAll* Got ${result.length} followships`, level: 6, timestamp: new Date().toISOString(), userID: userID });
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
        throw errorGen(`Error getting follower followships: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      global.logger.info({ message: `*followships-getAllFollowers* Got ${followships.length} follower followships`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return followships;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in followships getAllFollowers', err.code || 520, err.name || 'unhandledError_followships-getAllFollowers', err.isOperational || false, err.severity || 2);
    }
  }

  async function getFollowshipByID(options) {
    try {
      const { data, error } = await db.from('followships').select().eq('followshipID', options.followshipID).single();

      if (error) {
        throw errorGen(`Error getting followship ${options.followshipID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `*followships-getFollowshipByID* Got followship ${options.followshipID}`, level: 6, timestamp: new Date().toISOString(), userID: options.userID });
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
        throw errorGen(`Error getting profile user_id ${following}: ${profileError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!profile) {
        throw errorGen(`Profile user_id ${following} does not exist, can't create followship`, 515, 'cannotComplete', false, 3);
      }

      // ensure followship does not already exist
      const { data: existingFollowship, existingFollowshipError } = await db.from('followships').select().eq('userID', userID).eq('following', following);
      if (existingFollowshipError) {
        throw errorGen(`Error checking for existing followship: ${existingFollowshipError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingFollowship.length && existingFollowship[0].deleted === false) {
        throw errorGen(`Followship already exists, cannot create`, 515, 'cannotComplete', false, 3);
      } else if (existingFollowship.length && existingFollowship[0].deleted === true) {
        // if followship exists but is deleted, undelete it
        const { data: undelete, undeleteError } = await db.from('followships').update({ deleted: false, appMessageStatus: 'notAcked', appMessageDate: new Date() }).eq('followshipID', existingFollowship[0].followshipID).select('*').single();
        if (undeleteError) {
          throw errorGen(`Error undeleting followship ${existingFollowship[0].followshipID}: ${undeleteError.message}`, 513, 'failSupabaseUpdate', true, 3);
        }
        global.logger.info({ message: `*followships-create* Undeleted followship ${existingFollowship[0].followshipID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
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
        throw errorGen(`Error creating followship: ${error.message}`, 512, 'failSupabaseInsert', true, 3);
      }
      global.logger.info({ message: `*followships-create* Created followship ${customID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
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
        throw errorGen(`Error getting followship ${options.followshipID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!followship) {
        throw errorGen(`Followship ${options.followshipID} does not exist, cannot delete`, 515, 'cannotComplete', false, 3);
      }

      // delete followship
      const { data, error: deleteError } = await db.from('followships').update({ deleted: true }).eq('followshipID', options.followshipID);
      if (deleteError) {
        throw errorGen(`Error deleting followship ${options.followshipID}: ${deleteError.message}`, 514, 'failSupabaseDelete', true, 3);
      }
      global.logger.info({ message: `*followships-deleteFollowship* Deleted followship ${options.followshipID}`, level: 6, timestamp: new Date().toISOString(), userID: options.userID });
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
