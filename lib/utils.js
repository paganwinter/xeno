const debug = require('debug')('xeno');


function getContentType(headers) {
  const contentType = headers['content-type'];
  if (contentType.includes('json')) return 'json';
  if (contentType.includes('xml')) return 'xml';
  if (contentType.includes('text/plain')) return 'text';
  if (contentType.includes('x-www-form-urlencoded')) return 'form';
  return null;
}


function readBody(req, opts = {}) {
  // const { limit } = opts;
  // const contentLength = (req.headers['content-length'] === undefined)
  //   ? NaN
  //   : Number.parseInt(req.headers['content-length'], 10);

  // if (contentLength > limit) {
  //   const err = new Error('Request body is too large');
  //   err.status = 413;
  //   throw err;
  // }

  const { readAsString } = opts;
  return new Promise((resolve) => {
    // let chunks = readAsString ? '' : [];
    const chunks = [];
    let rawBody;

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      rawBody = Buffer.concat(chunks);

      if (readAsString) {
        rawBody = rawBody.toString();
      }
      resolve(rawBody);
    });
  });
}


async function parseBody(ctx, opts) {
  const { bodyParsers } = opts;

  // TODO: refer fastify parser and raw-body to safely read body
  // TODO: multi-part
  // https://github.com/fastify/fastify/blob/main/lib/contentTypeParser.js
  // https://github.com/stream-utils/raw-body/blob/master/index.js
  // https://github.com/koajs/koa-body/blob/master/index.js
  // https://github.com/koajs/bodyparser/blob/master/index.js
  // https://github.com/expressjs/body-parser/blob/master/lib/read.js

  let body;
  let rawBody;

  if (['post', 'put', 'patch'].includes(ctx.req.method)) {
    // if content-type is to be parsed, read and optionally parse body
    const contentType = getContentType(ctx.req.headers);

    const bodyParser = bodyParsers[`${contentType}`];
    if (bodyParser) {
      const {
        read, parser, readAsString = true, limit,
      } = bodyParser;

      if (read || parser) {
        rawBody = await readBody(ctx.request, { readAsString, limit });
        body = rawBody;
      }
      debug('body read');

      if (parser) {
        body = await parser(body);
        debug('body parsed');
      }
    } else {
      // do not parse body
    }
  }
  return { body, rawBody };
}


async function respond(ctx) {
  const { response } = ctx;

  if (!response.statusCode) ctx.res.status(200);

  if (typeof ctx.res.body !== 'undefined') {
    // TODO: support streams
    if (typeof ctx.res.body === 'string' || Buffer.isBuffer(ctx.res.body)) {
      response.write(ctx.res.body);
    } else {
      if (!response.getHeader('content-type')) ctx.res.header('content-type', 'application/json');
      response.write(JSON.stringify(ctx.res.body));
    }
  }
  return response.end(async () => {
    ctx.res.sent = true;
    debug('response sent');
    // onRes Hooks
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
  parseBody,
  respond,
  handleError,

  // only for testing
  readBody,
  getContentType,
};
