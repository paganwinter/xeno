const { parseRequest } = require('./parser');
const { Router } = require('./router');

class Xeno {
  constructor() {
    this.router = new Router();

    this.onReqHooks = [];
    this.onParseHooks = [];
    this.onRouteHooks = [];
    this.onResHooks = [];
  }

  getHandler() {
    const handler = async (request, response) => {
      // request.on('error', (err) => {
      //   console.error(err);
      // });
      try {
        const ctx = {
          req: {}, res: {}, request, response,
        };

        this.onReqHooks.map(async (fn) => { await fn(ctx); });

        ctx.req = await parseRequest(request);
        this.onParseHooks.map(async (fn) => { await fn(ctx); });

        const { route, params } = this.router.find(ctx.req);
        ctx.route = route;
        ctx.req.params = params;
        this.onRouteHooks.map(async (fn) => { await fn(ctx); });

        await ctx.route.handler(ctx);

        this.respond(ctx);
      } catch (err) {
        // TODO: error handling
        console.log(err);
        response.statusCode = err.status || 500;
        response.end(err.message || 'Internal Server Error');
      }
    };
    return handler;
  }

  respond(ctx) {
    ctx.res.status = ctx.res.status || 200;

    // TODO: allow adding individual headers
    ctx.res.headers = ctx.res.headers || {};

    const { response } = ctx;


    response.statusCode = ctx.res.status;

    Object.entries(ctx.res.headers).forEach(([hdrName, hdrVal]) => {
      response.setHeader(hdrName, hdrVal);
    });

    if (ctx.res.body) {
      // TODO: support strings, objects, buffers, and streams
      if (typeof ctx.res.body === 'string') {
        response.write(ctx.res.body);
      } else {
        if (!response.getHeader('content-type')) response.setHeader('content-type', 'application/json');
        response.write(JSON.stringify(ctx.res.body));
      }
    }

    response.end();

    this.onResHooks.map(async (fn) => {
      await fn(ctx);
    });
  }


  start(serverType, serverOpts = {}, ...args) {
    const server = serverType.createServer(serverOpts, this.getHandler());
    return server.listen(...args);
  }


  addRoute(route) {
    this.router.addRoute(route);
  }

  onRequest(fn) {
    this.onReqHooks.push(fn);
  }

  onParse(fn) {
    this.onParseHooks.push(fn);
  }

  onRoute(fn) {
    this.onRouteHooks.push(fn);
  }

  onResponse(fn) {
    this.onResHooks.push(fn);
  }
}

module.exports = Xeno;
