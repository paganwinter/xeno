# Xeno

- [Xeno](#xeno)
  - [Install](#install)
  - [Usage](#usage)
    - [Start](#start)
    - [Access](#access)

## Install
```bash
npm i git@github.service.anz:parasurv/xeno.git
```

## Usage
### Start
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
    ctx.res.body = ctx.req;
  },
});

app.addRoute({
  method: 'post',
  url: '/',
  async handler(ctx) {
  },
});

const server = http.createServer(app.getHandler());
server.listen(3000, () => { console.log('server started'); });
```

### Access
```bash
curl --location --request GET 'localhost:3000'

curl --location --request POST 'localhost:3000' \
--header 'Content-Type: application/json' \
--data-raw '{ "hello": "world" }'
```
