async function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
  });
}

async function parseRequest(req) {
  const baseUrl = req.headers.host;
  const urlParts = new URL(req.url, `http://${baseUrl}`);
  const { hostname: host, port, pathname: path } = urlParts;
  const query = Object.fromEntries(urlParts.searchParams.entries());

  const rawBody = await readBody(req);
  let body;
  if (/json/.test(req.headers['content-type'])) {
    body = JSON.parse(rawBody);
  }

  const request = {
    host,
    port,
    method: req.method.toLowerCase(),
    originalUrl: req.url,
    url: path,
    path,
    query,
    headers: req.headers,
    rawBody,
    body,
  };

  return request;
}

module.exports = {
  parseRequest,
};
