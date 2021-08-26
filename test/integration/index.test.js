const chai = require('chai');
chai.use(require('chai-http'));

const Xeno = require('../..');

const { expect } = chai;

describe('integration tests', () => {
  describe('', () => {
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
      expect(result.body.req.path).to.equal('/test/123');
      expect(result.body.req.query).to.deep.equal({ limit: '100', type: 'some' });
      expect(result.body.req.params).to.deep.equal({ testId: '123' });
      expect(result.body.req.headers.authorization).to.equal('Bearer');
      expect(result.body.req.route).to.deep.equal({ method: 'POST', path: '/test/:testId', config: { some: 'metadata' } });
      expect(result.body.req.body).to.deep.equal({ hello: 'world' });
    });

    it('route without body', async () => {
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
  });
});
