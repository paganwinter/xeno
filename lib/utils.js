const debug = require('debug')('xeno');



async function respond(ctx) {
  const { response } = ctx;

  // if (!response.statusCode) ctx.res.status(200);

  if (typeof ctx.res.body !== 'undefined') {
    // TODO: support streams
    if (typeof ctx.res.body === 'string' || Buffer.isBuffer(ctx.res.body)) {
      ctx.res.header('content-length', Buffer.byteLength(ctx.res.body));
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
  respond,
  handleError,
};
