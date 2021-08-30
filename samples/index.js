/* eslint-disable no-console */

const http = require('http');

const Xeno = require('..');

const app = new Xeno({
  // querystringParser: (queryStr) => {},
  errorHandler: async (err, ctx) => {
    ctx.res.status(err.status || 500);
    ctx.res.header('x-error-info', 'something');
    ctx.res.body = err.message;
  },
});

app.addHook('onRequest', async (ctx) => {
  console.log('onRequest: received request and created ctx');
  console.log(ctx.req.method, ctx.req.url, ctx.req.headers);
});

app.addHook('onParse', async (ctx) => {
  console.log('onParse: request parsed');
  console.log(ctx.req.query);
  console.log(ctx.req.rawBody);
  console.log(ctx.req.body);
});

app.addHook('onRoute', async (ctx) => {
  console.log('onRoute: route and path params identified');
  console.log('path params', ctx.req.params);
  console.log('found route', ctx.req.route);
});

app.addHook('onSend', async (ctx) => {
  console.log('onSend: response to be sent');
  console.log(ctx.res.status());
  console.log(ctx.res.headers());
  console.log(ctx.res.body);
});

app.addHook('onResponse', (ctx) => {
  console.log('onResponse: response sent');
  console.log(ctx.res.status());
  console.log(ctx.res.headers());
  console.log(ctx.res.body);
});


app.addRoute({
  url: '/minimal',
  async handler() {
    // do nothing
  },
});

app.addRoute({
  url: '/',
  async handler(ctx) {
    ctx.res.status(418);
    ctx.res.header('powered-by', 'xeno');
    ctx.res.headers({
      'x-b3-traceid': '1234',
      'powered-by': 'xeno', // overrides earlier one
    });
    ctx.res.body = ctx.req;
  },
  config: { hello: 'world' }, // available in ctx.req.route
});

app.addRoute({
  method: 'post',
  url: '/accounts',
  async handler(ctx) {
    ctx.res.status(201);
    ctx.res.body = ctx.req.body;
  },
});

app.addRoute({
  url: '/accounts/:acctId',
  async handler(ctx) {
    ctx.res.body = ctx.req.params;
  },
});

app.addRoute({
  url: '/accounts/:acctId/txns/:txns',
  async handler(ctx) {
    ctx.res.body = ctx.req.params;
  },
});

app.addRoute({
  method: ['get', 'post'],
  url: '/proxy/*all',
  async handler(ctx) {
    ctx.res.body = `I am a proxy for ${ctx.req.method} ${ctx.req.url}`;
  },
});


app.start(http, {}, 3000, (...args) => {
  console.log('server started');
  console.log(...args);
});
