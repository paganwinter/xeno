/* eslint-disable no-underscore-dangle */
function splitUrl(url) {
  let uri = url;
  let search = '';

  const qsIdx = url.indexOf('?');
  if (qsIdx > -1) {
    uri = url.substr(0, qsIdx);
    search = url.slice(qsIdx + 1);
  }
  return { uri, search };
}


class Request {
  constructor(request) {
    this.raw = request;
    const { uri, search } = splitUrl(request.url);

    this.method = request.method.toLowerCase();
    this.originalUrl = request.url;
    this.uri = uri;
    this.url = uri;
    this.search = search ? `?${search}` : '';
    this.query = search;
    this.headers = request.headers;
    this.params = {};

    this.rawBody = undefined;
    this._bodyRead = false;
    this.body = undefined;

    this.route = undefined;
  }

  async readRawBody(opts) {
    // https://github.com/fastify/fastify/blob/main/lib/contentTypeParser.js
    // https://github.com/stream-utils/raw-body/blob/master/index.js

    // https://github.com/koajs/koa-body/blob/master/index.js
    // https://github.com/koajs/bodyparser/blob/master/index.js
    // https://github.com/expressjs/body-parser/blob/master/lib/read.js

    // TODO: encoding and compression

    if (this._bodyRead) {
      return this.rawBody;
    }

    const { limit, asString = false } = opts;

    const contentLength = (this.raw.headers['content-length'] === undefined)
      ? null
      : Number.parseInt(this.raw.headers['content-length'], 10);

    if (limit && (contentLength > limit)) {
      const err = new Error('Request body too large');
      err.status = 413;
      err.code = 'REQ_BODY_TOO_LARGE';
      throw err;
    }


    this._bodyRead = true;
    this.rawBody = await read(this.raw); // eslint-disable-line no-use-before-define
    return this.rawBody;

    async function read(reqStream) {
      return new Promise((resolve, reject) => {
        let chunks = [];
        let receivedLength = 0;

        reqStream.on('data', onData); // eslint-disable-line no-use-before-define
        reqStream.on('end', onEnd); // eslint-disable-line no-use-before-define
        reqStream.on('error', onEnd); // eslint-disable-line no-use-before-define
        reqStream.on('close', onClose); // eslint-disable-line no-use-before-define

        function onData(chunk) {
          if (asString) {
            chunks += chunk;
          } else {
            chunks.push(chunk);
          }
          receivedLength += chunk.length;

          if (limit && (receivedLength > limit)) {
            const err = new Error('Request body too large');
            err.status = 413;
            err.code = 'REQ_BODY_TOO_LARGE';
            reject(err);
          }
        }

        function onEnd(err) {
          if (err) {
            err.status = 400; // eslint-disable-line no-param-reassign
            return reject(err);
          }

          if (contentLength && (receivedLength !== contentLength)) {
            const sizeErr = new Error('Request body size did not match Content-Length');
            sizeErr.status = 400;
            sizeErr.code = 'REQ_BODY_NOT_EQUAL_CONTENT_LEN';
            reject(sizeErr);
          }

          // this.rawBody = (asString) ? chunks : Buffer.concat(chunks);
          // this._bodyRead = true;
          const rawBody = (asString) ? chunks : Buffer.concat(chunks);

          return resolve(rawBody);
        }

        function onClose() {
          chunks = null;

          reqStream.removeListener('data', onData);
          reqStream.removeListener('end', onEnd);
          reqStream.removeListener('error', onEnd);
          reqStream.removeListener('close', onClose);
        }
      });
    }
  }

  toJSON() {
    const { raw, ...others } = this;
    return {
      raw: 'raw node js request',
      ...others,
    };
  }
}

module.exports = {
  Request,
};
