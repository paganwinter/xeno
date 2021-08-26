/* eslint-disable no-console */

const http = require('http');

const Xeno = require('..');

const app = new Xeno();

app.onParse((ctx) => {
  console.log(ctx.req);
  console.log(ctx.req.method, ctx.req.url);
});

app.onRoute((ctx) => {
  console.log('found route', ctx.route);
});

app.onResponse((ctx) => {
  console.log(ctx.res.status);
});

app.addRoute({
  url: '/',
  async handler(ctx) {
    ctx.res.status(418);
    ctx.res.header('powered-by', 'xeno');
    ctx.res.body = ctx.req;
  },
  config: { hello: 'world' },
});

app.addRoute({
  url: '/test',
  async handler() {
    // do nothing
  },
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
