const debug = require('debug')('xeno');
const querystring = require('querystring');

const { Request } = require('./request');
const { Response } = require('./response');
const { Router } = require('./xeno-router');

const {
  parseBody, handleError, respond,
} = require('./utils');



class Xeno {
  constructor(opts = {}) {
    // this.port = opts.port;
    this.router = opts.router || new Router();

    this.opts = {
      includeRawBody: opts.includeRawBody,
      querystringParser: opts.querystringParser || querystring.parse,
    };

    this.bodyParsers = {
      json: { parser: JSON.parse, limit: 10000 },
      text: { read: true },
      form: { parser: querystring.parse },
      xml: { read: true },
    };

    this.errorHandler = opts.errorHandler;

    // this.hooks = {
    //   onRequest: [],
    //   onParse: [],
    //   onRoute: [],
    //   onSend: [],
    //   onResponse: [],
    // };
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


        // identify route
        const route = this.router.find(ctx.req.method, ctx.req.url);
        if (route.error) throw route.error;
        ctx.req.route = { method: route.method, path: route.path, config: route.data.config };
        ctx.req.params = route.params;
        debug('route identified');


        // parse body
        const { body, rawBody } = await parseBody(ctx, { bodyParsers: this.bodyParsers });
        ctx.req.body = body;
        if (this.opts.includeRawBody) ctx.req.rawBody = rawBody;
        debug('body parsed');


        // handle route
        debug('calling route handler');
        await route.data.handler(ctx);


        // send response
        debug('sending response');
        await respond(ctx);
        debug('response snet');
      } catch (err) {
        // console.log(err); // eslint-disable-line no-console
        debug('error', err);

        // handle error
        await handleError(err, ctx, this.errorHandler);
      }
    };

    return handleRequest;
  }


  addRoute(route) {
    const {
      method = 'get', path, url, handler, config,
    } = route;
    this.router.on(method, (path || url), { handler, config });
  }

  // onRequest(fn) {
  //   this.hooks.onRequest.push(fn);
  // }

  // onParse(fn) {
  //   this.hooks.onParse.push(fn);
  // }

  // onRoute(fn) {
  //   this.hooks.onRoute.push(fn);
  // }

  // onSend(fn) {
  //   this.hooks.onSend.push(fn);
  // }

  // onResponse(fn) {
  //   this.hooks.onResponse.push(fn);
  // }

  start(serverType, serverOpts = {}, ...args) {
    const server = serverType.createServer(serverOpts, this.getHandler());
    return server.listen(...args);
  }
}

module.exports = Xeno;
