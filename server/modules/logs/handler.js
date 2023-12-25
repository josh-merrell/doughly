// 'use strict';

// async function getLogByID(req, res) {
//   const db = req.client.db;
//   const p = require('./processor')({ db });
//   const { logID } = req.params;
//   const returner = await p.get.byID({ userID: req.userID, logID });
//   return res.json(returner);
// }

// async function getLogs(req, res) {
//   const db = req.client.db;
//   const p = require('./processor')({ db });
//   const { logIDs, subjectID, category, eventType, createdAfter, createdBefore } = req.query;
//   const returner = await p.get.all({ userID: req.userID, logIDs, subjectID, category, eventType, createdAfter, createdBefore });
//   return res.json(returner);
// }

// async function createLog(req, res) {
//   const db = req.client.db;
//   const p = require('./processor')({ db });
//   const { subjectID, category, eventType, resultValue } = req.body;
//   const { customID } = req;
//   const returner = await p.create({
//     customID,
//     userID: req.userID,
//     subjectID,
//     category,
//     eventType,
//     resultValue,
//   });
//   return res.json(returner);
// }

// module.exports = {
//   getLogByID,
//   getLogs,
//   createLog,
// };
