'use strict';

async function getPlayStorePreview(req, res) {
  return res.redirect(`${process.env.PLAY_STORE_LINK}`);
}

async function getAppStorePreview(req, res) {
  return res.redirect(`${process.env.APP_STORE_LINK}`);
}

module.exports = {
  getPlayStorePreview,
  getAppStorePreview,
};
