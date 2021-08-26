const querystring = require('querystring');

function splitUrl(url) {
  // This is slooow
  // const urlParts = new URL(req.url, `http://${req.headers.host}`);
  // const { hostname: host, port, pathname: path } = urlParts;
  // const query = Object.fromEntries(urlParts.searchParams.entries());

  const qsIdx = url.indexOf('?');
  let uri = url;
  let search = '';
  if (qsIdx > -1) {
    search = url.slice(qsIdx + 1);
    uri = url.substr(0, qsIdx);
  }
  return { uri, search };
}

class Request {
  constructor(req, opts = {}) {
    this.raw = req;

    this.method = req.method.toLowerCase();
    this.originalUrl = req.url;

    const { uri, search } = splitUrl(req.url);
    this.uri = uri;
    this.url = uri;
    this.path = uri;
    this.params = {};
    this.search = search;
    this.query = (opts.querystringParser) ? opts.querystringParser(search) : querystring.parse(search);

    this.headers = req.headers;
    this.rawBody = undefined;
    this.body = undefined;

    this.route = undefined;
  }

  async readBody() {
    return new Promise((resolve) => {
      let chunks;
      this.raw.on('data', (chunk) => {
        if (!chunks) chunks = [];
        chunks.push(chunk);
      });
      this.raw.on('end', () => {
        if (typeof chunks !== 'undefined') {
          const rawBody = Buffer.concat(chunks).toString();
          this.rawBody = rawBody;
          resolve(rawBody);
        }
        resolve();
      });
    });
  }

  parseBody() {
    if (/json/.test(this.headers['content-type'])) {
      this.body = JSON.parse(this.rawBody);
      return this.body;
    }
    this.body = this.rawBody;
    return this.body;
  }

  toJSON() {
    return {
      method: this.method,
      originalUrl: this.originalUrl,
      uri: this.uri,
      url: this.url,
      path: this.path,
      params: this.params,
      search: this.search,
      query: this.query,
      headers: this.headers,
      rawBody: this.rawBody,
      body: this.body,
      route: this.route,
    };
  }
}
module.exports = {
  Request,
};
