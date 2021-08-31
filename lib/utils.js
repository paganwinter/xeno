const querystring = require('querystring');

const debug = require('debug')('xeno');
const typeIs = require('type-is');

async function hookRunner(name, allHooks, ctx) {
  const hooks = allHooks[`${name}`];
  for (let i = 0, len = hooks.length; i < len; i++) {
    const fn = hooks[`${i}`];
    await fn(ctx); // eslint-disable-line no-await-in-loop
  }
}


function parseQuery(query, parser) {
  // use default parser
  if (parser === true) return querystring.parse(query);
  // use custom parser
  return parser(query);
}


async function parseBody(req, parsers) {
  // TODO: body parsing logic
  // if content-type is required to be parsed, then read and parse
  const type = typeIs(req);
  let body;
  switch (typeIs(req, ['application/json', 'text/plain', 'urlencoded', 'multipart', 'application/xml'])) {
    case 'application/json': {
      const { limit, parser } = parsers.json;
      body = parser(await req.readRawBody({ limit, asString: true }));
      break;
    }
    case 'urlencoded': {
      const { limit, parser } = parsers.urlencoded;
      body = parser(await req.readRawBody({ limit, asString: true }));
      break;
    }
    case 'text/plain': {
      const { limit } = parsers.text;
      body = await req.readRawBody({ limit, asString: true });
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

  return { type, body };
}



async function respond(ctx) {
  const { response } = ctx;

  // if (!response.statusCode) ctx.res.status(200);

  if (typeof ctx.res.body !== 'undefined') {
    // TODO: support streams
    if (typeof ctx.res.body === 'string' || Buffer.isBuffer(ctx.res.body)) {
      // if (!response.getHeader('content-type')) ctx.res.header('content-type', 'text/plain');
      // if (!response.getHeader('content-type')) ctx.res.header('content-type', 'application/octet-stream');
      // ctx.res.header('content-length', Buffer.byteLength(ctx.res.body));
      response.write(ctx.res.body);
    } else {
      if (!response.getHeader('content-type')) ctx.res.header('content-type', 'application/json');
      const bodyStr = JSON.stringify(ctx.res.body);
      // ctx.res.header('content-length', Buffer.byteLength(bodyStr));
      response.write(bodyStr);
    }
  }

  return new Promise((resolve) => {
    response.end(() => {
      ctx.res.sent = true;
      debug('response sent');
      resolve();
    });
  });
}


async function handleError(err, ctx, customErrorHandler) {
  try {
    ctx.res.status(err.status || 500);
    ctx.res.header('content-type', 'text/plain');
    ctx.res.body = err.message;

    if (customErrorHandler) {
      debug('calling error handler');
      await customErrorHandler(err, ctx);
    }

    debug('sending response');
    await respond(ctx);
  } catch (error) {
    console.log(error); // eslint-disable-line no-console
    ctx.response.statusCode = err.status || 500;
    ctx.response.end(err.message || 'Internal Server Error');
  }
}

module.exports = {
  hookRunner,
  parseQuery,
  parseBody,
  respond,
  handleError,
};
