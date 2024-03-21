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
    return { html };
  } catch (error) {
    global.logger.error(`Error getting HTML from URL: ${url}`);
    throw error;
  }
};

const extractFromHtml = async (html) => {
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
  // global.logger.info(`Text extracted from HTML: ${text}`);
  return text.trim(); // Trim the text to remove any leading/trailing whitespace
};

module.exports = {
  getHtml,
  extractFromHtml,
};
