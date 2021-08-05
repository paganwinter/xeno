/* eslint-disable no-console */

const http = require('http');

const Xeno = require('..');

const app = new Xeno();

app.onRequest((ctx) => {
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
  method: 'get',
  url: '/',
  async handler(ctx) {
    ctx.res.status = 418;
    ctx.res.headers = {
      'powered-by': 'xeno',
    };
    ctx.res.body = ctx.req;
  },
});

app.addRoute({
  method: 'get',
  url: '/test',
  async handler() {
    // do nothing
  },
});

app.addRoute({
  method: 'post',
  url: '/accounts',
  async handler(ctx) {
    ctx.res.status = 201;
    ctx.res.body = ctx.req.body;
  },
});

app.addRoute({
  method: 'get',
  url: '/accounts/:id',
  async handler(ctx) {
    ctx.res.body = ctx.req.params;
  },
});


const server = http.createServer(app.getHandler());
server.listen(3000, (...args) => {
  console.log('server started');
  console.log(...args);
});
