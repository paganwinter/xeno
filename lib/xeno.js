const debug = require('debug')('xeno');

const { Router } = require('./xeno-router');

const { parseRequest } = require('./parser');


function createCtx(rawRequest, rawResponse) {
  const ctx = {
    req: {},
    res: {
      raw: rawResponse,
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
      headers(hdrs) {
        Object.entries(hdrs).forEach(([hdr, val]) => rawResponse.setHeader(hdr, val));
      },
      body: undefined,
      sent: false,
    },
    rawRequest,
    rawResponse,
  };
  return ctx;
}

class Xeno {
  constructor(opts = {}) {
    // TODO: add support for custom routers
    this.router = opts.router || new Router();
    this.hooks = {
      onRequest: [],
      onParse: [],
      onRoute: [],
      onSend: [],
      onResponse: [],
    };
  }

  getHandler() {
    const handler = async (rawRequest, rawResponse) => {
      // request.on('error', (err) => {
      //   console.error(err);
      // });

      try {
        const ctx = createCtx(rawRequest, rawResponse);
        debug('created ctx');
        // if (this.onReqHooks.length) await Promise.all(this.onReqHooks.map(async (fn) => { await fn(ctx); }));
        // if (this.onReqHooks.length) {
        //   const fns = this.onReqHooks;
        //   for (let i = 0, len = fns.length; i < len; i++) {
        //     await fns[i](ctx); // eslint-disable-line no-await-in-loop
        //   }
        // }


        const parsedReq = await parseRequest(rawRequest);
        ctx.req = { ...ctx.req, ...parsedReq };
        debug('parsed request');
        // if (this.onParseHooks.length) await Promise.all(this.onParseHooks.map(async (fn) => { await fn(ctx); }));


        const route = this.router.find(ctx.req.method, ctx.req.url);
        if (route.error) {
          throw route.error;
        }
        debug('found route');
        ctx.req.params = route.params;
        ctx.req.route = { method: route.method, path: route.path, config: route.data.config };
        // if (this.onRouteHooks.length) await Promise.all(this.onRouteHooks.map(async (fn) => { await fn(ctx); }));

        debug('calling route handler');
        await route.data.handler(ctx);

        debug('sending response');
        this.respond(ctx);
      } catch (err) {
        debug('error');
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
    const rawRes = ctx.rawResponse;
    // if (!ctx.res.status()) { ctx.res.status(200); }
    rawRes.statusCode = rawRes.statusCode || 200;

    const { body } = ctx.res;
    if (body) {
      // TODO: support streams
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        rawRes.write(body);
      } else {
        if (!rawRes.getHeader('content-type')) rawRes.setHeader('content-type', 'application/json');
        rawRes.write(JSON.stringify(body));
      }
    }

    return rawRes.end(async () => {
      ctx.res.sent = true;
      // if (this.onResHooks.length) await Promise.all(this.onResHooks.map(async (fn) => { await fn(ctx); }));
    });
  }


  start(serverType, serverOpts = {}, ...args) {
    // console.log(this.router.prettyPrint({ commonPrefix: false }));

    const server = serverType.createServer(serverOpts, this.getHandler());
    return server.listen(...args);
  }


  addRoute(route) {
    const {
      method = 'get', path, url, handler, config,
    } = route;
    this.router.on(method, (path || url), { handler, config });
  }

  onRequest(fn) {
    this.hooks.onRequest.push(fn);
  }

  onParse(fn) {
    this.hooks.onParse.push(fn);
  }

  onRoute(fn) {
    this.hooks.onRoute.push(fn);
  }

  onSend(fn) {
    this.hooks.onSend.push(fn);
  }

  onResponse(fn) {
    this.hooks.onResponse.push(fn);
  }
}

module.exports = Xeno;
