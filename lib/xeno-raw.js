/* eslint-disable no-console */
const http = require('http');
const querystring = require('querystring');

const { Request } = require('./request');
const { Response } = require('./response');
const { Router } = require('./xeno-router');
// const {
//   hookRunner, parseQuery, parseBody, respond, handleError,
// } = require('./utils');


const router = new Router();
router.on('get', '/test', {});
router.on('post', '/test/:id', {});

const server = http.createServer(async (request, response) => {
  const ctx = {};
  try {
    // setup ctx
    ctx.req = new Request(request);
    ctx.res = new Response(response);
    // eslint-disable-next-line no-inner-declarations
    function onResFinish(err) {
      response.removeListener('finish', onResFinish);
      response.removeListener('error', onResFinish);

      // log res
      console.log(ctx.res.raw.statusCode, err);
    }
    response.on('finish', onResFinish);
    response.on('error', onResFinish);


    // log req
    console.log(ctx.req.method, ctx.req.url);


    // identify route
    const route = router.find(ctx.req.method, ctx.req.url);
    if (route.error) throw route.error;
    ctx.req.params = route.params;
    ctx.req.route = route.route;

    // parse req
    ctx.req.query = querystring.parse(ctx.req.query);
    ctx.req.body = (await ctx.req.readRawBody()).toString();
    console.log(ctx.req.toJSON());


    // handler code

    // respond
    const { res } = ctx;
    res.status(418); // response.statusCode = 418;
    res.header('content-type', 'application/json'); // response.setHeader('content-type', 'application/json');
    res.send('{"hello":"world"}'); // response.write('{"hello":"world"}'); response.end();

    res.send('{"hello":"world"}'); // response.write('{"hello":"world"}'); response.end();
    res.header('content-type', 'application/json'); // response.setHeader('content-type', 'application/json');
  } catch (err) {
    console.log(err);
    response.statusCode = err.status || 500;
    response.setHeader('content-type', 'text/plain');
    response.end(err.message);
  }
});

server.listen(3000, () => {
  console.log('started...');
});
