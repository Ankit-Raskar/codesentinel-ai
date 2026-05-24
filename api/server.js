import server from '../dist/server/server.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const invokePath = req.headers['x-invoke-path'];
    
    const pathname = invokePath || req.url;
    const fullUrl = new URL(pathname, `${protocol}://${host}`);

    const init = {
      method: req.method,
      headers: req.headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = req;
      init.duplex = 'half';
    }

    const webRequest = new Request(fullUrl.href, init);
    const webResponse = await server.fetch(webRequest);

    res.status(webResponse.status);
    webResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (webResponse.body) {
      const reader = webResponse.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } else {
      res.end();
    }
  } catch (error) {
    console.error("Vercel Serverless Error:", error);
    res.status(500).send("Internal Server Error: " + error.stack);
  }
}
