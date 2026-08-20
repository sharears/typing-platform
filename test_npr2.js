const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");

async function run() {
  const url = "https://www.npr.org/2023/08/30/1196726884/university-of-michigan-wont-use-letter-grades-for-some-freshmen-this-fall-semester";
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    }
  });
  let html = await response.text();
  
  // Try to find the actual title string in the HTML
  const match = html.match(/<title>(.*?)<\/title>/);
  console.log("RAW HTML TITLE:", match ? match[1] : null);

  const doc = new JSDOM(html, { url });
  const reader = new Readability(doc.window.document);
  const article = reader.parse();

  console.log("READABILITY TITLE:", article.title);

  let processedHtml = article.content
    .replace(/<h1[^>]*>.*?<\/h1>/gi, '') 
    .replace(/<(p|div|h[1-6]|li|blockquote)[^>]*>/gi, '\n\n<$1>')
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '</$1>\n\n')
    .replace(/<br\s*\/?>/gi, '\n\n');
    
  const contentDom = new JSDOM(processedHtml);
  const rawText = contentDom.window.document.body.textContent || "";
  
  const blocks = rawText.split(/\n\s*\n+/);
  console.log("FIRST 5 BLOCKS:");
  blocks.slice(0, 5).forEach((b, i) => console.log(`[${i}]`, b.trim()));
}

run();
