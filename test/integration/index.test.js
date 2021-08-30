/* eslint-disable max-lines-per-function */
const chai = require('chai');
chai.use(require('chai-http'));

const Xeno = require('../..');

const { expect } = chai;

describe('integration tests', () => {
  describe('application', () => {
    it('most basic route without method and empty handler', async () => {
      const app = new Xeno();
      app.addRoute({
        url: '/test',
        async handler() { /**/ },
      });
      const request = chai.request(app.getHandler()).get('/test');
      const result = await request;
      expect(result.status).to.equal(200);
      expect(result.text).to.equal('');
    });

    it('simple route returning status, headers, and body', async () => {
      const app = new Xeno();
      app.addRoute({
        method: 'GET',
        url: '/test',
        async handler(ctx) {
          ctx.res.status(418);
          ctx.res.header('x-powered-by', 'xeno');
          ctx.res.body = { hello: 'world' };
        },
      });
      const request = chai.request(app.getHandler())
        .get('/test');
      const result = await request;
      expect(result.status).to.equal(418);
      expect(result.headers['x-powered-by']).to.equal('xeno');
      expect(result.body).to.deep.equal({ hello: 'world' });
    });

    it('route returning ctx.req', async () => {
      const app = new Xeno();
      app.addRoute({
        method: 'POST',
        url: '/test/:testId',
        async handler(ctx) {
          const { req } = ctx;
          ctx.res.body = { req };
        },
        config: { some: 'metadata' },
      });
      const request = chai.request(app.getHandler())
        .post('/test/123?limit=100&type=some')
        .set('authorization', 'Bearer')
        .send({ hello: 'world' });
      const result = await request;
      expect(result.body.req.method).to.equal('post');
      expect(result.body.req.originalUrl).to.equal('/test/123?limit=100&type=some');
      expect(result.body.req.uri).to.equal('/test/123');
      expect(result.body.req.url).to.equal('/test/123');
      expect(result.body.req.query).to.deep.equal({ limit: '100', type: 'some' });
      expect(result.body.req.params).to.deep.equal({ testId: '123' });
      expect(result.body.req.headers.authorization).to.equal('Bearer');
      expect(result.body.req.route).to.deep.equal({ method: 'POST', path: '/test/:testId', config: { some: 'metadata' } });
      expect(result.body.req.body).to.deep.equal({ hello: 'world' });
    });

    it('route without request body', async () => {
      const app = new Xeno();
      app.addRoute({
        method: 'GET',
        url: '/test',
        async handler(ctx) {
          const { body } = ctx.req;
          ctx.res.body = { body };
        },
      });
      const request = chai.request(app.getHandler())
        .get('/test');
      const result = await request;
      expect(result.body.body).to.deep.equal(undefined);
    });

    it('post json data', async () => {
      const app = new Xeno();
      app.addRoute({
        method: 'POST',
        url: '/test',
        async handler(ctx) {
          const { body } = ctx.req;
          ctx.res.body = { body };
        },
      });
      const request = chai.request(app.getHandler())
        .post('/test')
        .set('content-type', 'application/json')
        .send({ hello: 'world' });
      const result = await request;
      expect(result.body.body).to.deep.equal({ hello: 'world' });
    });

    it('post text data', async () => {
      const app = new Xeno();
      app.addRoute({
        method: 'POST',
        url: '/test',
        async handler(ctx) {
          const { body } = ctx.req;
          ctx.res.body = { body };
        },
      });
      const request = chai.request(app.getHandler())
        .post('/test')
        .set('content-type', 'text/plain')
        .send('hello world');
      const result = await request;
      expect(result.body.body).to.deep.equal('hello world');
    });

    it('post form data', async () => {
      const app = new Xeno();
      app.addRoute({
        method: 'POST',
        url: '/test',
        async handler(ctx) {
          const { body } = ctx.req;
          ctx.res.body = { body };
        },
      });
      const request = chai.request(app.getHandler())
        .post('/test')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send('hello=world');
      const result = await request;
      expect(result.body.body).to.deep.equal({ hello: 'world' });
    });

    it('handles errors by default', async () => {
      const app = new Xeno();
      app.addRoute({
        method: 'GET',
        url: '/test',
        async handler() {
          const err = new Error('Uh oh');
          err.status = 501;
          throw err;
        },
      });
      const request = chai.request(app.getHandler())
        .get('/test');
      const result = await request;
      expect(result.status).to.equal(501);
      expect(result.text).to.equal('Uh oh');
    });

    it('handles 404', async () => {
      const app = new Xeno();
      app.addRoute({
        method: 'GET',
        url: '/test',
        async handler() { /**/ },
      });
      const request = chai.request(app.getHandler())
        .get('/invalid');
      const result = await request;
      expect(result.status).to.equal(404);
      expect(result.text).to.equal('Not Found');
    });

    it('handles 405', async () => {
      const app = new Xeno();
      app.addRoute({
        method: 'GET',
        url: '/test',
        async handler() { /**/ },
      });
      const request = chai.request(app.getHandler())
        .delete('/test');
      const result = await request;
      expect(result.status).to.equal(405);
      expect(result.text).to.equal('Method Not Allowed');
    });
  });

  describe('errorHandler', () => {
    it('calls error handler', async () => {
      const app = new Xeno({
        async errorHandler(err, ctx) {
          ctx.res.status(510);
          ctx.res.body = 'formatted error';
        },
      });
      app.addRoute({
        url: '/test',
        async handler() {
          const err = new Error('Uh oh');
          err.status = 501;
          throw err;
        },
      });

      const request = (await chai.request(app.getHandler()).get('/test'));
      const result = await request;
      expect(result.status).to.equal(510);
      expect(result.text).to.equal('formatted error');
    });
  });

  describe('hooks', () => {
    it('throws for invalid hooks', async () => {
      const app = new Xeno();
      function wrap() {
        app.addHook('onInvalid', async () => {
        });
      }
      expect(wrap).to.throw('Unknown hook onInvalid');
    });

    it('runs onRequest Hooks', async () => {
      const app = new Xeno();
      app.addHook('onRequest', async (ctx) => {
        ctx.req.data = {};
        ctx.req.data.query = ctx.req.query;
        ctx.req.data.body = ctx.req.body;
        ctx.req.data.hooks = [];
      });
      app.addHook('onRequest', async (ctx) => {
        ctx.req.data.hooks.push('hook 1');
      });
      app.addHook('onRequest', async (ctx) => {
        ctx.req.data.hooks.push('hook 2');
      });
      app.addRoute({
        method: 'post',
        url: '/test',
        async handler(ctx) {
          ctx.res.body = ctx.req.data;
        },
      });

      const request = (await chai.request(app.getHandler()).post('/test?limit=10&item=a&item=b').send({ hello: 'world' }));
      const result = await request;
      expect(result.body).to.deep.equal({
        query: 'limit=10&item=a&item=b',
        // body: undefined,
        hooks: ['hook 1', 'hook 2'],
      });
    });

    it('runs onParse Hooks', async () => {
      const app = new Xeno();
      app.addHook('onParse', async (ctx) => {
        ctx.req.data = {};
        ctx.req.data.query = ctx.req.query;
        ctx.req.data.body = ctx.req.body;
        ctx.req.data.hooks = [];
      });
      app.addHook('onParse', async (ctx) => {
        ctx.req.data.hooks.push('hook 1');
      });
      app.addHook('onParse', async (ctx) => {
        ctx.req.data.hooks.push('hook 2');
      });
      app.addRoute({
        method: 'post',
        url: '/test',
        async handler(ctx) {
          ctx.res.body = ctx.req.data;
        },
      });

      const request = (await chai.request(app.getHandler()).post('/test?limit=10&item=a&item=b').send({ hello: 'world' }));
      const result = await request;
      expect(result.body).to.deep.equal({
        query: {
          limit: '10',
          item: ['a', 'b'],
        },
        body: { hello: 'world' },
        hooks: ['hook 1', 'hook 2'],
      });
    });

    it('runs onRoute Hooks', async () => {
      const app = new Xeno();
      app.addHook('onRoute', async (ctx) => {
        ctx.req.data = {};
        ctx.req.data.route = ctx.req.route;
        ctx.req.data.hooks = [];
      });
      app.addHook('onRoute', async (ctx) => {
        ctx.req.data.hooks.push('hook 1');
      });
      app.addHook('onRoute', async (ctx) => {
        ctx.req.data.hooks.push('hook 2');
      });
      app.addRoute({
        method: 'post',
        url: '/test',
        meta: 'data',
        async handler(ctx) {
          ctx.res.body = ctx.req.data;
        },
      });

      const request = (await chai.request(app.getHandler()).post('/test?limit=10&item=a&item=b').send({ hello: 'world' }));
      const result = await request;
      expect(result.body).to.deep.equal({
        route: {
          method: 'post',
          path: '/test',
          meta: 'data',
        },
        hooks: ['hook 1', 'hook 2'],
      });
    });

    it('runs onSend Hooks', async () => {
      const app = new Xeno();
      app.addHook('onSend', async (ctx) => {
        ctx.req.data = {
          status: '',
          headers: {},
          hooks: [],
        };
        ctx.res.status(418);
      });
      app.addHook('onSend', async (ctx) => {
        ctx.req.data.hooks.push('hook 1');
        ctx.res.header('test-hdr', 'set in onSend');
      });
      app.addHook('onSend', async (ctx) => {
        ctx.req.data.hooks.push('hook 2');
        ctx.req.data.status = ctx.res.status();
        ctx.req.data.headers['test-hdr'] = ctx.res.header('test-hdr');
        ctx.res.body = ctx.req.data;
      });

      app.addRoute({
        method: 'post',
        url: '/test',
        meta: 'data',
        async handler(ctx) {
          ctx.res.status(201);
          ctx.res.header('test-hdr', 'set in handler');
          ctx.res.body = ctx.req.data;
        },
      });

      const request = (await chai.request(app.getHandler()).post('/test?limit=10&item=a&item=b').send({ hello: 'world' }));
      const result = await request;
      expect(result.status).to.equal(418);
      expect(result.headers['test-hdr']).to.equal('set in onSend');
      expect(result.body).to.deep.equal({
        status: 418,
        headers: {
          'test-hdr': 'set in onSend',
        },
        hooks: ['hook 1', 'hook 2'],
      });
    });

    it('runs onResponse Hooks', async () => {
      const app = new Xeno();
      app.addHook('onResponse', async (ctx) => {
        ctx.req.data = {};
      });
      app.addHook('onResponse', async (ctx) => {
        console.log('onResponse hook 1', 'ctx.res.sent', ctx.res.sent);
      });
      app.addHook('onResponse', async (ctx) => {
        console.log('onResponse hook 2', 'ctx.res.status', ctx.res.status());
      });

      app.addRoute({
        method: 'post',
        url: '/test',
        meta: 'data',
        async handler() {
          //
        },
      });

      const request = (await chai.request(app.getHandler()).post('/test?limit=10&item=a&item=b').send({ hello: 'world' }));
      const result = await request;
      // console.log(result.headers);
      expect(result.body).to.deep.equal({});
    });
  });
});
