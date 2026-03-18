<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d9a748dd-8bdd-42a3-b63f-c33a398e05e0

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## GitHub Pages Deployment

This app can be built as a static SPA, but GitHub Pages cannot run the Express proxy in [server.ts](server.ts). MangaDex also does not expose browser-compatible CORS headers for direct requests from your Pages origin, so the deployed frontend needs a separate proxy endpoint.

Set `VITE_MANGADEX_API_BASE` to a proxy URL that forwards requests to `https://api.mangadex.org` and returns the appropriate CORS headers.

Examples:

1. Local development: no extra setup needed, because `npm run dev` uses the local Express proxy at `/api/mangadex`.
2. Static deployment: set `VITE_MANGADEX_API_BASE` to something like `https://your-proxy.example.com/api/mangadex`.

Without that proxy, the GitHub Pages site will load but API requests will fail with browser CORS errors.
