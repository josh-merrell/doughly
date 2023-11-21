const { createUserLog } = require('../../../services/dbLogger');

('use strict');

module.exports = ({ db, dbPublic }) => {
  async function getAll(options) {
    const { userID, followshipIDs, name } = options;

    let q = db.from('followships').select().filter('userID', 'eq', userID).eq('deleted', false).order('followshipID', { ascending: true });

    if (followshipIDs) {
      q = q.in('followshipID', followshipIDs);
    }

    const { data: followships, error } = await q;
    for (let followship of followships) {
      followship.match = true;
    }
    if (error) {
      global.logger.info(`Error getting followships: ${error.message}`);
      return { error: error.message };
    }

    // if 'name' is provided, need to get the 'profile object for every followship.following and keep in data only if thier first or last name includes 'name'
    if (name) {
      for (let i = 0; i < followships.length; i++) {
        const followship = followships[i];
        const { data: profile, profileError } = await dbPublic.from('profiles').select().eq('user_id', followship.following).single();
        if (profileError) {
          global.logger.info(`Error getting profile user_id ${followship[i].following}: ${profileError.message}`);
          return { error: profileError.message };
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
  }

  async function getFollowshipByID(options) {
    const { data, error } = await db.from('followships').select().eq('followshipID', options.followshipID).single();

    if (error) {
      global.logger.info(`Error getting followship ${options.followshipID}: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got followship ${options.followshipID}`);
    return data;
  }

  async function create(options) {
    const { customID, authorization, userID, following } = options;

    // ensure profile exists for following
    const { data: profile, profileError } = await dbPublic.from('profiles').select().eq('user_id', following).single();
    if (profileError) {
      global.logger.info(`Error getting profile user_id ${following}: ${profileError.message}`);
      return { error: profileError.message };
    }
    if (!profile) {
      global.logger.info(`Profile user_id ${following} does not exist`);
      return { error: `Profile user_id ${following} does not exist` };
    }

    // ensure followship does not already exist
    const { data: existingFollowship, existingFollowshipError } = await db.from('followships').select().eq('userID', userID).eq('following', following);
    if (existingFollowshipError) {
      global.logger.info(`Error checking for existing followship: ${existingFollowshipError.message}`);
      return { error: existingFollowshipError.message };
    }
    if (existingFollowship.length && existingFollowship[0].deleted === false) {
      global.logger.info(`Followship already exists`);
      return { error: `Followship already exists` };
    } else if (existingFollowship.length && existingFollowship[0].deleted === true) {
      // if followship exists but is deleted, undelete it
      const { data: undelete, undeleteError } = await db.from('followships').update({ deleted: false }).eq('followshipID', existingFollowship[0].followshipID).single();
      if (undeleteError) {
        global.logger.info(`Error undeleting followship ${existingFollowship[0].followshipID}: ${undeleteError.message}`);
        return { error: undeleteError.message };
      }
      global.logger.info(`Undeleted followship ${existingFollowship[0].followshipID}`);
      createUserLog(userID, authorization, 'createdFollowship', existingFollowship[0].followshipID, null, null, null, 'started following ' + profile.name_first + ' ' + profile.name_last);
      return undelete;
    }

    // create followship
    const { data: followship, error } = await db.from('followships').insert({ followshipID: customID, userID, following, deleted: false }).select().single();
    if (error) {
      global.logger.info(`Error creating followship: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Created followship ${customID}`);
    createUserLog(userID, authorization, 'createdFollowship', followship.followshipID, null, null, null, 'started following ' + profile.name_first + ' ' + profile.name_last);
    return followship;
  }

  async function deleteFollowship(options) {
    // ensure followship exists
    const { data: followship, error } = await db.from('followships').select().eq('followshipID', options.followshipID).single();
    if (error) {
      global.logger.info(`Error getting followship ${options.followshipID}: ${error.message}`);
      return { error: error.message };
    }
    if (!followship) {
      global.logger.info(`Followship ${options.followshipID} does not exist`);
      return { error: `Followship ${options.followshipID} does not exist` };
    }

    // delete followship
    const { data, error: deleteError } = await db.from('followships').update({ deleted: true }).eq('followshipID', options.followshipID);
    if (deleteError) {
      global.logger.info(`Error deleting followship ${options.followshipID}: ${deleteError.message}`);
      return { error: deleteError.message };
    }
    global.logger.info(`Deleted followship ${options.followshipID}`);
    createUserLog(options.userID, options.authorization, 'deletedFollowship', Number(options.followshipID), null, null, null, 'stopped following ' + followship.following);
    return data;
  }

  return {
    create,
    delete: deleteFollowship,
    get: {
      all: getAll,
      by: {
        ID: getFollowshipByID,
      },
    },
  };
};
