const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");

async function run() {
  const url = "https://www.npr.org/2023/08/30/1196726884/university-of-michigan-wont-use-letter-grades-for-some-freshmen-this-fall-semester";
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    }
  });
  const html = await response.text();
  
  const doc = new JSDOM(html, { url });
  
  const junkSelectors = [
    'figcaption', 
    'figure', 
    '.caption', 
    '.credit', 
    '.image-credit',
    '.image-caption',
    'button',
    '[aria-label*="caption"]',
    'h1'
  ];
  
  doc.window.document.querySelectorAll(junkSelectors.join(',')).forEach(el => {
    el.remove();
  });

  const reader = new Readability(doc.window.document);
  const article = reader.parse();

  const contentDom = new JSDOM(article.content);
  const blocks = contentDom.window.document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote');
  
  let extractedBlocks = [];
  const titleLower = (article.title || "").toLowerCase().trim();
  
  console.log("TITLE:", titleLower);
  
  blocks.forEach(el => {
     const text = el.textContent?.trim();
     if (text) {
       const lower = text.toLowerCase();
       
       if (
         lower === "hide caption" || 
         lower === "toggle caption" || 
         lower === "image caption" ||
         lower === "download" ||
         lower === "transcript" ||
         lower.startsWith("embed <iframe") ||
         (titleLower && lower === titleLower) ||
         (titleLower && titleLower.startsWith(lower) && lower.length > 10)
       ) {
         console.log("FILTERED:", text);
         return;
       }
       
       extractedBlocks.push(text.replace(/\n/g, ' ').replace(/[ \t]+/g, ' '));
     }
  });
  
  console.log("=== OUTPUT ===");
  console.log(extractedBlocks.join('\n\n'));
}

run();
