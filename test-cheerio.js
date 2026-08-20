const cheerio = require('cheerio');
fetch('https://en.wikipedia.org/wiki/Photosynthesis')
  .then(r => r.text())
  .then(html => {
    const $ = cheerio.load(html);
    $('script, style, noscript, iframe, img, svg').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    console.log(text.substring(0, 100));
    console.log("Length: " + text.length);
  });
