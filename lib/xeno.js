const debug = require('debug')('xeno');
const querystring = require('querystring');

const typeIs = require('type-is');

const { Request } = require('./request');
const { Response } = require('./response');
const { Router } = require('./xeno-router');

const {
  handleError, respond,
} = require('./utils');


async function hookRunner(name, allHooks, ctx) {
  const hooks = allHooks[`${name}`];
  for (let i = 0, len = hooks.length; i < len; i++) {
    const fn = hooks[`${i}`];
    await fn(ctx); // eslint-disable-line no-await-in-loop
  }
}

class Xeno {
  constructor(opts = {}) {
    // this.port = opts.port;
    this.router = opts.router || new Router();

    this.opts = {
      includeRawBody: opts.includeRawBody,
      querystringParser: opts.querystringParser || querystring.parse,
    };

    this.bodyParsers = {
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


        // create ctx
        ctx.req = new Request(request, this.opts);
        ctx.res = new Response(response);
        debug('ctx created');
        // run onRequest hooks
        await hookRunner('onRequest', this.hooks, ctx);


        if (this.opts.querystringParser) ctx.req.query = this.opts.querystringParser(ctx.req.query);

        // body parsing logic
        // if content-type is required to be parsed, then read and parse
        ctx.req.type = typeIs(ctx.req);
        // console.log('>>>', ctx.req.type);
        switch (typeIs(ctx.req, ['application/json', 'text/plain', 'urlencoded', 'multipart', 'application/xml'])) {
          case 'application/json': {
            const { limit, parser } = this.bodyParsers.json;
            ctx.req.body = parser(await ctx.req.readRawBody({ limit, asString: true }));
            break;
          }
          case 'urlencoded': {
            const { limit, parser } = this.bodyParsers.urlencoded;
            ctx.req.body = parser(await ctx.req.readRawBody({ limit, asString: true }));
            break;
          }
          case 'text/plain': {
            const { limit } = this.bodyParsers.text;
            ctx.req.body = await ctx.req.readRawBody({ limit, asString: true });
            break;
          }
          case 'multipart': {
            break;
          }
          case 'application/xml': {
            break;
          }
          default: {
            // // 415 error code
            // res.statusCode = 415;
            // res.end();
            break;
          }
        }
        // run onParse hooks
        await hookRunner('onParse', this.hooks, ctx);


        // identify route
        const route = this.router.find(ctx.req.method, ctx.req.url);
        if (route.error) throw route.error;
        ctx.req.params = route.params;
        ctx.req.route = route.route;
        debug('route identified');
        // run onRoute hooks
        await hookRunner('onRoute', this.hooks, ctx);


        // console.log(ctx.req.toJSON());


        // handle route
        // TODO move to hook
        debug('calling route handler');
        if (route.route.handler) await route.route.handler(ctx);


        // send response
        debug('sending response');
        // run onSend hooks
        await hookRunner('onSend', this.hooks, ctx);
        await respond(ctx);

        debug('response snet');
        // run onResponse hooks
        await hookRunner('onResponse', this.hooks, ctx);
      } catch (err) {
        console.log(err); // eslint-disable-line no-console
        debug('error', err);

        // handle error
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
