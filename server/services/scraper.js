const playwright = require('playwright');
const cheerio = require('cheerio');

const getHtml = async (url) => {
  let browser;
  try {
    global.logger.info(`Getting HTML from URL: ${url}`);
    browser = await playwright.chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url);
    const html = await page.content();
    global.logger.info(`HTML from URL: ${url} retrieved`);
    return html;
  } catch (error) {
    global.logger.error(`Error getting HTML from URL: ${url}`);
    throw error;
  }
};

const extractFromHtml = async (html) => {
  // load html into cheerio and get all text from the page. Save the text to a single string.
  const $ = cheerio.load(html);
  const text = $('*').text();
  global.logger.info(`Text extracted from HTML: ${text}`);
  return text;
};

module.exports = {
  getHtml,
  extractFromHtml,
};
