const querystring = require('querystring');

async function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (chunk) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      resolve(body);
    });
  });
}

function parseUrl(url) {
  // This is sloooow
  // const urlParts = new URL(req.url, `http://${req.headers.host}`);
  // const { hostname: host, port, pathname: path } = urlParts;
  // const query = Object.fromEntries(urlParts.searchParams.entries());

  let query = {};
  let uri = url;

  const qsIdx = url.indexOf('?');
  if (qsIdx > -1) {
    query = querystring.parse(url.slice(qsIdx + 1));
    uri = url.substr(0, qsIdx);
  }
  return { query, uri };
}

async function parseRequest(req) {
  const method = req.method.toLowerCase();
  const { query, uri } = parseUrl(req.url);
  // const [host, port] = req.headers.host.split(':'); // TODO

  let rawBody;
  let body;
  if (['post', 'put', 'patch'].includes(method)) {
    rawBody = await readBody(req);
    if (/json/.test(req.headers['content-type'])) {
      body = JSON.parse(rawBody);
    }
  }

  const request = {
    // host,
    // port,
    originalUrl: req.url,
    method,
    uri,
    url: uri,
    path: uri,
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
