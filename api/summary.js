import { fetch } from 'undici';
import { extract } from '@extractus/article-extractor';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export default async function handler(req, res) {
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set.');
    return res.status(500).json({ error: 'Server configuration error: API key missing.' });
  }

  const GEMINI_API_URL = `${GEMINI_API_URL_BASE}?key=${GEMINI_API_KEY}`;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    new URL(url); 
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    let articleHtml;
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'URLSummarizerBot/1.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' // Pretend to be Googlebot for better content access
        }
      });
      if (!response.ok) {
        // Try to get error message from the page if possible, or use statusText
        let errorText = response.statusText;
        try {
            const pageErrorText = await response.text();
            // Avoid sending back huge HTML pages as error messages
            errorText = pageErrorText.substring(0, 200) + (pageErrorText.length > 200 ? '...' : '');
        } catch { /* ignore if can't read body */ }
        throw new Error(`Failed to fetch URL: ${response.status} ${errorText}`);
      }
      articleHtml = await response.text();
    } catch (fetchError) {
      if (fetchError.name === 'TimeoutError') {
        return res.status(408).json({ error: 'Request timed out while fetching the URL (5s limit).' });
      }
      console.error('Error fetching URL:', fetchError.message);
      return res.status(500).json({ error: `Failed to fetch content from URL: ${fetchError.message}` });
    }

    let extractedContent;
    try {
      const article = await extract(articleHtml, { html: true }); // pass html directly
      if (article && article.content) {
        // article-extractor often returns HTML, we need plain text
        // A simple way to strip HTML tags for Gemini (it can handle some HTML but plain text is safer for prompts)
        extractedContent = article.content.replace(/<[^>]+>/g, ' ').replace(/\s\s+/g, ' ').trim();
      } else {
        const plainText = articleHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gis, '')
                                   .replace(/<script[^>]*>[\s\S]*?<\/script>/gis, '')
                                   .replace(/<[^>]+>/g, ' ')
                                   .replace(/\s\s+/g, ' ')
                                   .trim();
        extractedContent = plainText;
        if (!extractedContent) {
             return res.status(500).json({ error: 'Could not extract readable content. The page might be empty or non-textual.' });
        }
      }
    } catch (extractionError) {
      console.error('Error extracting content:', extractionError);
      return res.status(500).json({ error: 'Failed to process content from the page after fetching.' });
    }
    
    const textForGemini = extractedContent.substring(0, 8000);

    const geminiPrompt = "以下のウェブページ本文を50文字以内1行で要約してください。句点は付けない";
    
    const geminiRequestBody = {
      contents: [{
        parts: [
          { text: geminiPrompt },
          { text: "\n---\nウェブページ本文:\n" },
          { text: textForGemini }
        ]
      }],
      generationConfig: {
        maxOutputTokens: 120, // Japanese chars can take more tokens, 50 chars * ~2 tokens/char + buffer
        temperature: 0.4, // Lower temperature for more factual summary
        topP: 0.95,
        topK: 40,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ]
    };

    let geminiResponseData;
    try {
      const geminiRes = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiRequestBody),
        signal: AbortSignal.timeout(20000), // Gemini API timeout 20s
      });

      geminiResponseData = await geminiRes.json(); // Try to parse JSON regardless of status for error details

      if (!geminiRes.ok) {
        console.error('Gemini API Error:', geminiRes.status, JSON.stringify(geminiResponseData, null, 2));
        const errorMessage = geminiResponseData?.error?.message || `Gemini API request failed with status ${geminiRes.status}.`;
        if (geminiRes.status === 429) {
             return res.status(503).json({ error: `Gemini API quota exceeded or rate limited. Details: ${errorMessage}` });
        }
        return res.status(500).json({ error: `Gemini API error: ${errorMessage}` });
      }
    } catch (apiError) {
       if (apiError.name === 'TimeoutError') {
        return res.status(504).json({ error: 'Gemini API request timed out (20s limit).' });
      }
      console.error('Gemini API request failed:', apiError);
      return res.status(500).json({ error: 'Failed to communicate with Gemini API.' });
    }

    const summaryText = geminiResponseData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!summaryText) {
      // Check for blocked content due to safety settings or other reasons
      const blockReason = geminiResponseData?.promptFeedback?.blockReason;
      if (blockReason) {
        console.warn('Gemini content blocked:', blockReason, JSON.stringify(geminiResponseData.promptFeedback, null, 2));
        return res.status(400).json({ error: `Summary generation blocked due to: ${blockReason}. The content might violate safety policies.` });
      }
      console.error('Gemini response did not contain summary text:', JSON.stringify(geminiResponseData, null, 2));
      return res.status(500).json({ error: 'Failed to get a valid summary from Gemini. Response was empty or malformed.' });
    }

    return res.status(200).json({ summary: summaryText });

  } catch (error) {
    console.error('Unhandled error in /api/summary:', error.message, error.stack);
    return res.status(500).json({ error: 'An unexpected server error occurred. Please try again later.' });
  }
}
