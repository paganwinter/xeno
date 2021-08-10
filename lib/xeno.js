const findMyWay = require('find-my-way');

const { parseRequest } = require('./parser');

function createCtx(rawRequest, rawResponse) {
  const ctx = {
    req: {},
    res: {
      status(sts) {
        if (sts) {
          rawResponse.statusCode = sts; // eslint-disable-line no-param-reassign
        }
        return rawResponse.statusCode;
      },
      header(hdr, val) {
        if (typeof val !== 'undefined') {
          return rawResponse.setHeader(hdr, val);
        }
        return rawResponse.getHeader(hdr);
      },
      body: undefined,
    },
    rawRequest,
    rawResponse,
  };
  return ctx;
}

class Xeno {
  constructor(opts = {}) {
    this.router = opts.router || findMyWay();

    this.onReqHooks = [];
    this.onParseHooks = [];
    this.onRouteHooks = [];
    this.onResHooks = [];
  }

  getHandler() {
    const handler = async (rawRequest, rawResponse) => {
      // request.on('error', (err) => {
      //   console.error(err);
      // });

      try {
        const ctx = createCtx(rawRequest, rawResponse);
        // if (this.onReqHooks.length) await Promise.all(this.onReqHooks.map(async (fn) => { await fn(ctx); }));
        // if (this.onReqHooks.length) {
        //   const fns = this.onReqHooks;
        //   for (let i = 0, len = fns.length; i < len; i++) {
        //     await fns[i](ctx); // eslint-disable-line no-await-in-loop
        //   }
        // }


        ctx.req = await parseRequest(rawRequest);
        // if (this.onParseHooks.length) await Promise.all(this.onParseHooks.map(async (fn) => { await fn(ctx); }));


        const { route, params } = await this.router.lookup(ctx.rawRequest);
        ctx.req.route = route;
        ctx.req.params = params;
        // if (this.onRouteHooks.length) await Promise.all(this.onRouteHooks.map(async (fn) => { await fn(ctx); }));


        await route.handler(ctx);
        this.respond(ctx);
      } catch (err) {
        // TODO: error handling
        console.log(err);
        rawResponse.statusCode = err.status || 500; // eslint-disable-line no-param-reassign
        rawResponse.end(err.message || 'Internal Server Error');
      }
    };
    return handler;
  }

  // eslint-disable-next-line class-methods-use-this
  respond(ctx) {
    const { rawResponse } = ctx;

    rawResponse.statusCode = rawResponse.statusCode || 200;

    const { body } = ctx.res;
    if (body) {
      // TODO: support streams
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        rawResponse.write(body);
      } else {
        if (!rawResponse.getHeader('content-type')) rawResponse.setHeader('content-type', 'application/json');
        rawResponse.write(JSON.stringify(body));
      }
    }

    return rawResponse.end(async () => {
      // if (this.onResHooks.length) await Promise.all(this.onResHooks.map(async (fn) => { await fn(ctx); }));
    });
  }


  start(serverType, serverOpts = {}, ...args) {
    console.log(this.router.prettyPrint({ commonPrefix: false }));

    const server = serverType.createServer(serverOpts, this.getHandler());
    return server.listen(...args);
  }


  addRoute(route) {
    const { method = 'get', url } = route;
    this.router.on(method.toUpperCase(), url, async (req, res, params) => ({ route, params }));
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
