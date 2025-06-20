# URL One-Liner Summarizer

Build a tiny web app that takes any publicly reachable URL and returns a single-line summary (≤ 50 ja-JP characters) generated by Google Gemini.

## Features

-   Summarize web page content into a single line (max 50 Japanese characters).
-   Dark mode toggle.
-   24-hour KV cache for summaries (optional, if platform supports).
-   Health check endpoint (`/healthz`).

## Tech Stack

-   **Front‑end**: React + Vite + Tailwind CSS + framer-motion
-   **Back‑end**: Serverless endpoint `/api/summary` (Node.js)
-   **Page Content Extraction**: @extractus/article-extractor
-   **AI Model**: Google Gemini Pro

## Getting Started

1.  **Clone the repository (or create the project files as described).**

2.  **Create a `.env` file by copying `.env.example`:**
    ```bash
    cp .env.example .env
    ```
    Update `.env` with your Google Gemini API Key:
    ```
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    ```

3.  **Install dependencies (using pnpm):**
    ```bash
    pnpm install
    ```

4.  **Run the development server:**
    ```bash
    pnpm dev
    ```
    The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## API Endpoint

### `POST /api/summary`

Takes a URL and returns a single-line summary.

**Request Body:**

```json
{
  "url": "https://example.com"
}
```

**Success Response (200 OK):**

```json
{
  "summary": "ページの要約文"
}
```

**Error Responses:**

-   `400 Bad Request`: Invalid URL or missing URL.
-   `408 Request Timeout`: Page fetching timed out.
-   `500 Internal Server Error`: Error during content extraction or Gemini API call.
-   `503 Service Unavailable`: Gemini API quota exceeded or other Gemini API error.

## File Structure

```
/
├── README.md
├── .env.example
├── package.json
├── pnpm-lock.yaml
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── components/
│   │   ├── Spinner.jsx
│   │   └── Toast.jsx
│   └── assets/  (or public/ for static assets like icons)
├── api/
│   └── summary.js
├── public/
│   └── icon.png
├── tailwind.config.cjs
└── vite.config.js
```
