const debug = require('debug')('xeno');
const querystring = require('querystring');


const { Request } = require('./request');
const { Response } = require('./response');
const { Router } = require('./xeno-router');

const {
  hookRunner, parseQuery, parseBody, respond, handleError,
} = require('./utils');


class Xeno {
  constructor(opts = {}) {
    // this.port = opts.port;
    this.router = opts.router || new Router();

    this.opts = {
      querystringParser: (typeof opts.querystringParser === 'undefined') ? true : opts.querystringParser,
      includeRawBody: opts.includeRawBody,
      bodyParsers: {
        json: {
          headers: ['application/json'],
          parser: JSON.parse,
          limit: 100,
        },
        text: {
          headers: ['text/plain'],
          limit: 100,
        },
        urlencoded: {
          headers: ['application/x-www-form-urlencoded'],
          parser: querystring.parse,
          limit: 100,
        },
      },
      findRoute: true,
    };

    this.errorHandler = opts.errorHandler;

    this.hooks = {
      onRequest: [],
      onParse: [],
      onRoute: [],
      onSend: [],
      onResponse: [],
    };
  }


  getHandler() {
    const handleRequest = async (request, response) => {
      const ctx = {
        request,
        response,
      };

      try {
        // TODO
        // request.on('error', (err) => {
        //   console.error(err);
        // });
        const { hooks } = this;

        // create ctx
        ctx.req = new Request(request);
        ctx.res = new Response(response);
        debug('ctx created');

        async function onResFinish(err) { // eslint-disable-line no-inner-declarations
          response.removeListener('finish', onResFinish);
          response.removeListener('error', onResFinish);
          debug('response sent', err);
          await hookRunner('onResponse', hooks, ctx);
        }
        response.on('finish', onResFinish);
        response.on('error', onResFinish);


        await hookRunner('onRequest', hooks, ctx);


        if (this.opts.findRoute) {
          const route = this.router.find(ctx.req.method, ctx.req.url);
          if (route.error) throw route.error;
          ctx.req.params = route.params;
          ctx.req.route = route.route;
        }
        debug('route identified');


        await hookRunner('onRoute', hooks, ctx);


        if (this.opts.querystringParser) {
          ctx.req.query = parseQuery(ctx.req.query, this.opts.querystringParser);
        }
        if (this.opts.bodyParsers) {
          const { type, body } = await parseBody(ctx.req, this.opts.bodyParsers);
          ctx.req.type = type;
          ctx.req.body = body;
        }
        debug('request parsed');


        await hookRunner('onParse', hooks, ctx);


        // TODO move to hook
        debug('calling route handler');
        if (ctx.req.route.handler && (typeof ctx.req.route.handler === 'function')) {
          await ctx.req.route.handler(ctx);
        }


        await hookRunner('onSend', hooks, ctx);

        debug('sending response');
        await respond(ctx);
      } catch (err) {
        // console.log(err); // eslint-disable-line no-console
        debug('error', err);

        await handleError(err, ctx, this.errorHandler);
      }
    };

    return handleRequest;
  }


  addRoute(route) {
    const { method = 'get', url, ...rest } = route;
    this.router.on(method, url, rest);
  }

  addHook(hook, fn) {
    const allowedHooks = ['onRequest', 'onParse', 'onRoute', 'onSend', 'onResponse'];
    if (!allowedHooks.includes(hook)) {
      throw new Error(`Unknown hook ${hook}`);
    }
    this.hooks[`${hook}`].push(fn);
  }

  start(serverType, serverOpts = {}, ...args) {
    const server = serverType.createServer(serverOpts, this.getHandler());
    return server.listen(...args);
  }
}

module.exports = Xeno;
