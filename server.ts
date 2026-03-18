import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Proxy API requests to MangaDex to bypass CORS
  app.use("/api/mangadex", async (req, res) => {
    const targetUrl = `https://api.mangadex.org${req.url}`;
    try {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'User-Agent': 'MangaReaderApp/1.0',
          'Accept': 'application/json',
        }
      });
      
      const data = await response.text();
      res.status(response.status).type('application/json').send(data);
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).json({ error: 'Failed to proxy request' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
