import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { topic, fileData, fileMimeType } = await req.json();

    let content = "";
    let title = topic || "Generated Content";
    let isUrl = false;

    if (fileData && fileMimeType) {
      if (fileMimeType === "text/plain") {
        content = Buffer.from(fileData, "base64").toString("utf-8");
      } else if (fileMimeType === "application/pdf") {
        return new Response(JSON.stringify({ error: "PDF parsing is no longer supported in lightweight mode. Please use .txt files." }), { status: 400 });
      } else {
        return new Response(JSON.stringify({ error: "Unsupported file type. Only .txt is supported." }), { status: 400 });
      }
    } else {
      // Check if the topic is a URL
      isUrl = /^(https?:\/\/[^\s]+)$/i.test(topic);

      if (isUrl) {
        try {
          // Fetch raw HTML directly
          const response = await fetch(topic, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
            }
          });
          const html = await response.text();
          
          const lowerHtml = html.toLowerCase();
          if (
            lowerHtml.includes("verify you are human") ||
            lowerHtml.includes("security services to protect") ||
            lowerHtml.includes("automated verification process") ||
            lowerHtml.includes("cloudflare") ||
            lowerHtml.includes("checking your browser") ||
            lowerHtml.includes("just a moment...")
          ) {
            return new Response(
              JSON.stringify({ error: "The website you linked is heavily protected by a bot-blocker. The scraper was blocked. Please copy the raw text of the article and paste it directly into the input box instead of using the URL." }),
              { status: 400 }
            );
          }

          const { JSDOM } = require("jsdom");
          const { Readability } = require("@mozilla/readability");

          const doc = new JSDOM(html, { url: topic });
          
          // Pre-process DOM to remove common junk like image captions, credits, and interactive buttons
          const junkSelectors = [
            'figcaption', 
            'figure', 
            '.caption', 
            '.credit', 
            '.image-credit',
            '.image-caption',
            'button', // mostly interactive junk like 'toggle caption'
            '[aria-label*="caption"]',
            'h1' // Removes the main title from the typing content
          ];
          
          doc.window.document.querySelectorAll(junkSelectors.join(',')).forEach((el: Element) => {
            el.remove();
          });

          const reader = new Readability(doc.window.document);
          const article = reader.parse();

          if (!article || !article.content) {
            return new Response(
              JSON.stringify({ error: "Failed to extract meaningful text from this URL. Try copying the text into a .txt file instead." }),
              { status: 400 }
            );
          }

          // Clean up the extracted text - inject newlines for block elements to guarantee paragraph boundaries
          let processedHtml = article.content
            .replace(/<h1[^>]*>.*?<\/h1>/gi, '') // Remove the title that Readability forcibly injects
            .replace(/<(p|div|h[1-6]|li|blockquote)[^>]*>/gi, '\n\n<$1>')
            .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '</$1>\n\n')
            .replace(/<br\s*\/?>/gi, '\n\n');
            
          const contentDom = new JSDOM(processedHtml);
          content = contentDom.window.document.body.textContent || "";
          
          if (content.length > 50000) {
            content = content.substring(0, 50000);
          }
          
          title = article.title || "Article Extract";
        } catch (e) {
          return new Response(
            JSON.stringify({ error: "Failed to fetch content from the provided URL. Please ensure it is a valid and accessible link." }),
            { status: 400 }
          );
        }
      } else {
        // Just standard text topic provided
        content = topic;
      }
    }
    
    // Global normalization for ALL content sources (URL, pasted text, or .txt files)
    
    // 1. Normalize line endings
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // 2. Normalize typographical characters (smart quotes, dashes, etc.) to standard keyboard characters
    content = content
      .replace(/[‘’`´]/g, "'") // single quotes
      .replace(/[“”«»]/g, '"') // double quotes
      .replace(/[–—]/g, '-') // en and em dashes
      .replace(/…/g, '...'); // ellipsis
    
    // 3. Split into distinct paragraphs by 2 or more newlines
    const paragraphs = content.split(/\n\s*\n+/);
    
    // If it's pasted text (not a URL), we extract the title from the very first paragraph
    if (!isUrl && paragraphs.length > 0) {
      title = paragraphs[0].trim();
      if (title.length > 100) title = title.substring(0, 100) + "...";
    }
    
    const normalizeString = (s: string) => s.toLowerCase().replace(/[‘’`´]/g, "'").replace(/[“”«»]/g, '"').trim();
    const titleLower = normalizeString(title);
    
    content = paragraphs
      .map(p => {
        const text = p.trim();
        if (!text) return "";
        const lower = normalizeString(text);
        
        // Filter out common junk phrases and exact title matches (for BOTH URL and pasted text)
        if (
          lower === "hide caption" || 
          lower === "toggle caption" || 
          lower === "image caption" ||
          lower === "download" ||
          lower === "transcript" ||
          lower === "embed" ||
          lower.startsWith("embed <iframe") ||
          lower.startsWith("<iframe src") ||
          (titleLower && lower === titleLower) ||
          (titleLower && titleLower.startsWith(lower) && lower.length > 10) // catch partial title matches
        ) {
          return "";
        }
        
        // Within a paragraph, replace single newlines with spaces
        let cleaned = text.replace(/\n/g, ' ');
        // Collapse multiple spaces into exactly one space
        cleaned = cleaned.replace(/[ \t]+/g, ' ');
        return cleaned.trim();
      })
      .filter(p => p.length > 0)
      // Join the true paragraphs with exactly ONE newline
      .join('\n');
      
    console.log("=== FINAL GENERATED CONTENT ===");
    console.log(JSON.stringify(content.substring(0, 500)));
    console.log("===============================");
    
    return new Response(JSON.stringify({ content, title }), { status: 200 });
  } catch (error) {
    console.error("Content Extraction Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate content. Ensure the URL is valid or try a different topic." }), { status: 500 });
  }
}
