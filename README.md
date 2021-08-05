# Xeno

## Install
```bash
npm i git@github.service.anz:parasurv/xeno.git
```

## Usage
```js
const http = require('http');

const Xeno = require('xeno');

const app = new Xeno();

app.onRequest((ctx) => {
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
    ctx.res.headers = { 'powered-by': 'xeno' };
    ctx.res.body = { hello: 'world' };
  },
});

app.addRoute({
  method: 'post',
  url: '/',
  async handler(ctx) {
    ctx.res.body = ctx.req.body;
  },
});

const server = http.createServer(app.getHandler());
server.listen(3000, () => { console.log('server started'); });
```
