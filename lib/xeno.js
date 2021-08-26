const debug = require('debug')('xeno');

const { Request } = require('./request');
const { Response } = require('./response');
const { Router } = require('./xeno-router');


function createCtx(rawRequest, rawResponse, opts) {
  const req = new Request(rawRequest, opts);
  const res = new Response(rawResponse);

  const ctx = { req, res };
  return ctx;
}

class Xeno {
  constructor(opts = {}) {
    this.opts = opts;
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
    const handleRequest = async (rawRequest, rawResponse) => {
      // request.on('error', (err) => {
      //   console.error(err);
      // });

      let ctx;

      try {
        ctx = createCtx(rawRequest, rawResponse, this.opts);
        debug('ctx created');
        // if (this.onReqHooks.length) await Promise.all(this.onReqHooks.map(async (fn) => { await fn(ctx); }));


        const route = this.router.find(ctx.req.method, ctx.req.url);
        if (route.error) {
          throw route.error;
        }
        debug('route found');
        ctx.req.params = route.params;
        ctx.req.route = { method: route.method, path: route.path, config: route.data.config };
        // if (this.onRouteHooks.length) await Promise.all(this.onRouteHooks.map(async (fn) => { await fn(ctx); }));


        await ctx.req.readBody();
        debug('body read');
        ctx.req.parseBody();
        debug('body parsed');
        // if (this.onParseHooks.length) await Promise.all(this.onParseHooks.map(async (fn) => { await fn(ctx); }));


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
    return handleRequest;
  }

  // eslint-disable-next-line class-methods-use-this
  respond(ctx) {
    const rawRes = ctx.res.raw;

    rawRes.statusCode = rawRes.statusCode || 200;

    const { body } = ctx.res;

    if (typeof body !== 'undefined') {
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
      debug('response sent');
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
