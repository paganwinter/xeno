async function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
  });
}

async function parseRequest(request) {
  const urlParts = new URL(request.url, 'http://example.com');
  const [host, port] = request.headers.host.split(':');

  const rawBody = await readBody(request);
  let body;
  if (/json/.test(request.headers['content-type'])) {
    body = JSON.parse(rawBody);
  }

  const req = {
    host,
    port,
    method: request.method.toLowerCase(),
    originalUrl: request.url,
    url: urlParts.pathname,
    path: urlParts.pathname,
    query: urlParts.searchParams,
    headers: request.headers,
    rawBody,
    body,
  };

  return req;
}

function findRoute(req, routes) {
  // TODO: dynamic routes
  const matchedUrlRoutes = routes.filter((r) => (r.url === req.url));
  if (!matchedUrlRoutes.length === 0) {
    const err = new Error('Not Found');
    err.status = 404;
    throw err;
  }
  const matchedRoute = matchedUrlRoutes.find((r) => (r.method === req.method));
  if (!matchedRoute) {
    const err = new Error('Method Not Allowed');
    err.status = 405;
    throw err;
  }
  return matchedRoute;
}

class Xeno {
  constructor() {
    this.routes = [];
    this.onReqHooks = [];
    this.onRouteHooks = [];
    this.onResHooks = [];
  }

  getHandler() {
    const handler = async (request, response) => {
      // request.on('error', (err) => {
      //   console.error(err);
      // });
      let ctx;
      try {
        ctx = await this.createCtx(request, response);
        await this.handleRequest(ctx);
        this.respond(ctx);
      } catch (err) {
        // TODO: error handling
        response.statusCode = err.status || 500;
        response.end(err.message || 'Internal Server Error');
      }
    };
    return handler;
  }

  async createCtx(request, response) {
    const app = this;
    const req = await parseRequest(request);
    const res = {};

    const ctx = {
      app, req, res, request, response,
    };
    return ctx;
  }

  async handleRequest(ctx) {
    this.onReqHooks.map(async (fn) => {
      await fn(ctx);
    });

    ctx.route = findRoute(ctx.req, this.routes);

    this.onRouteHooks.map(async (fn) => {
      await fn(ctx);
    });

    ctx.route.handler(ctx);
  }

  respond(ctx) {
    ctx.res.status = ctx.res.status || 200;
    ctx.res.headers = ctx.res.headers || {};

    this.onResHooks.map(async (fn) => {
      await fn(ctx);
    });

    const { response } = ctx;

    response.statusCode = ctx.res.status;

    Object.entries(ctx.res.headers).forEach(([hdrName, hdrVal]) => {
      response.setHeader(hdrName, hdrVal);
    });

    if (ctx.res.body) {
      if (typeof ctx.res.body === 'string') {
        response.write(ctx.res.body);
      } else {
        if (!response.getHeader('content-type')) response.setHeader('content-type', 'application/json');
        response.write(JSON.stringify(ctx.res.body));
      }
    }
    return response.end();
  }

  addRoute(route) {
    this.routes.push(route);
  }

  onRequest(fn) {
    this.onReqHooks.push(fn);
  }

  onRoute(fn) {
    this.onRouteHooks.push(fn);
  }

  onResponse(fn) {
    this.onResHooks.push(fn);
  }
}

module.exports = Xeno;
