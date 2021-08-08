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
          req: {},
          res: {
            status(sts) {
              response.statusCode = sts;
            },
            header(hdr, val) {
              response.setHeader(hdr, val);
            },
            body: undefined,
          },
          request,
          response,
        };
        // if (this.onReqHooks.length) await Promise.all(this.onReqHooks.map(async (fn) => { await fn(ctx); }));

        ctx.req = await parseRequest(request);
        // if (this.onParseHooks.length) await Promise.all(this.onParseHooks.map(async (fn) => { await fn(ctx); }));

        const { route, params } = this.router.find(ctx.req);
        ctx.route = route;
        if (params) ctx.req.params = params;
        // if (this.onRouteHooks.length) await Promise.all(this.onRouteHooks.map(async (fn) => { await fn(ctx); }));

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

  // eslint-disable-next-line class-methods-use-this
  respond(ctx) {
    const { response } = ctx;

    response.statusCode = response.statusCode || 200;

    const { body } = ctx.res;
    if (body) {
      // TODO: support strings, objects, buffers, and streams
      if (typeof body === 'string') {
        return response.end(body);
      }
      if (!response.getHeader('content-type')) response.setHeader('content-type', 'application/json');
      return response.end(JSON.stringify(body));
    }

    return response.end();
    // if (this.onResHooks.length) await this.onResHooks.map(async (fn) => { await fn(ctx); });
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
