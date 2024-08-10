const playwright = require('playwright');
const cheerio = require('cheerio');
const { errorGen } = require('../middleware/errorHandling');

const getHtml = async (url) => {
  let browser;
  try {
    global.logger.info({ message: `*scraper-getHtml*Getting HTML from URL: ${url}`, level: 6, timestamp: new Date().toISOString(), userID: 0 });
    browser = await playwright.chromium.launch();
    const context = await browser.newContext();
    global.logger.info({ message: `*scraper-getHtml* made new playwright chromium context.`, level: 7, userID: 0 });
    const page = await context.newPage();
    global.logger.info({ message: `*scraper-getHtml* made new page with chromium context.`, level: 7, userID: 0 });
    await page.goto(url);
    global.logger.info({ message: `*scraper-getHtml* opened recipe URL with chromium page.`, level: 7, userID: 0 });
    const html = await page.content();
    global.logger.info({ message: `*scraper-getHtml*HTML from URL: ${url} retrieved`, level: 7, timestamp: new Date().toISOString(), userID: 0 });
    return { html };
  } catch (err) {
    throw errorGen(err.message || 'Unhandled Error in scraper getHtml', err.code || 520, err.name || 'unhandledError_scraper-getHtml', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
  } finally {
    if (browser) {
      await browser.close();
      global.logger.info({ message: `*scraper-getHtml* closed the playwright browser.`, level: 7, timestamp: new Date().toISOString(), userID: 0 });
    }
  }
};

const extractFromHtml = async (html) => {
  try {
    const $ = cheerio.load(html);

    // Remove image tags from the HTML to prevent processing their textual content
    $('img').remove();

    // Now extract text from the HTML, but more selectively to ensure we don't inadvertently include undesired content
    let text = '';
    $('body')
      .find('*')
      .not('script, style')
      .each(function () {
        const current = $(this);
        // Check if the current element is directly text-containing element
        if (current.children().length === 0) {
          // Element does not contain other elements
          text += ' ' + current.text();
        }
      });

    text = text.replace(/<img[^>]*>/g, ''); // Remove any remaining image tags
    global.logger.info({ message: `*scraper-extractFromHtml* Text extracted from HTML: ${text}`, level: 7, timestamp: new Date().toISOString(), userID: 0 });
    return text.trim(); // Trim the text to remove any leading/trailing whitespace
  } catch (err) {
    throw errorGen(err.message || 'Unhandled Error in scraper extractFromHtml', err.code || 520, err.name || 'unhandledError_scraper-extractFromHtml', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
  }
};

module.exports = {
  getHtml,
  extractFromHtml,
};
