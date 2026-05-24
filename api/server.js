import server from '../dist/server/server.js';

export default async function handler(request) {
  let url = new URL(request.url);
  const invokePath = request.headers.get('x-invoke-path');
  
  if (invokePath) {
    url.pathname = invokePath;
  }

  // Create a new request with the original path
  const init = {
    method: request.method,
    headers: request.headers,
  };
  
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
    init.duplex = 'half';
  }

  const modifiedRequest = new Request(url.href, init);
  return server.fetch(modifiedRequest);
}
