const chai = require('chai');
chai.use(require('chai-http'));

const Xeno = require('../..');

const { expect } = chai;

describe('', () => {
  const app = new Xeno();
  before(() => {
    app.addRoute({
      method: 'get',
      url: '/',
      async handler(ctx) {
        ctx.res.status = 200;
        ctx.res.headers = {
          'powered-by': 'xeno',
        };
        ctx.res.body = {
          req: ctx.req,
        };
      },
    });
    app.addRoute({
      method: 'post',
      url: '/',
      async handler(ctx) {
        ctx.res.status = 200;
        ctx.res.headers = {
          'powered-by': 'xeno',
        };
        ctx.res.body = {
          req: ctx.req,
        };
      },
    });
    app.addRoute({
      method: 'get',
      url: '/accounts/:acctId',
      async handler(ctx) {
        ctx.res.status = 200;
        ctx.res.headers = {
          'powered-by': 'xeno',
        };
        ctx.res.body = {
          req: ctx.req,
        };
      },
    });
    app.addRoute({
      method: 'get',
      url: '/accounts/:acctId/transactions/:txnId',
      async handler(ctx) {
        ctx.res.status = 200;
        ctx.res.headers = {
          'powered-by': 'xeno',
        };
        ctx.res.body = {
          req: ctx.req,
        };
      },
    });
  });

  describe('GET static path', () => {
    it('', async () => {
      const method = 'get';
      const url = '/';
      const params = undefined;
      const query = { type: 'something', limit: '100' };
      const headers = { authorization: 'Bearer' };
      const body = undefined;

      const request = chai.request(app.getHandler())[`${method}`](url);
      if (query) request.query(query);
      if (headers) Object.entries((hdr, val) => request.set(hdr, val));
      if (body) request.send(body);

      const result = await request;
      // console.log((result.status, result.headers, result.body));

      expect(result.status).to.equal(200);

      expect(result.headers).to.haveOwnProperty('powered-by', 'xeno');
      expect(result.headers).to.haveOwnProperty('content-type', 'application/json');

      expect(result.body.req).to.haveOwnProperty('method', method);
      expect(result.body.req).to.haveOwnProperty('url', url);
      if (params) expect(result.body.req.params).to.deep.equal(params);
      if (query) expect(result.body.req).to.deep.haveOwnProperty('query', query);
      if (headers) {
        Object.entries((hdr, val) => {
          expect(result.body.req.headers).to.haveOwnProperty(hdr, val);
        });
      }
      if (body) expect(result.body.req.body).to.deep.equal(body);
    });
  });

  describe('POST static path', () => {
    it('', async () => {
      const method = 'post';
      const url = '/';
      const params = undefined;
      const query = { type: 'something', limit: '100' };
      const headers = { authorization: 'Bearer' };
      const body = { hello: 'world' };

      const request = chai.request(app.getHandler())[`${method}`](url);
      if (query) request.query(query);
      if (headers) Object.entries((hdr, val) => request.set(hdr, val));
      if (body) request.send(body);

      const result = await request;
      // console.log((result.status, result.headers, result.body));

      expect(result.status).to.equal(200);

      expect(result.headers).to.haveOwnProperty('powered-by', 'xeno');
      expect(result.headers).to.haveOwnProperty('content-type', 'application/json');

      expect(result.body.req).to.haveOwnProperty('method', method);
      expect(result.body.req).to.haveOwnProperty('url', url);
      if (params) expect(result.body.req.params).to.deep.equal(params);
      if (query) expect(result.body.req).to.deep.haveOwnProperty('query', query);
      if (headers) {
        Object.entries((hdr, val) => {
          expect(result.body.req.headers).to.haveOwnProperty(hdr, val);
        });
      }
      if (body) expect(result.body.req.body).to.deep.equal(body);
    });
  });

  describe('GET dynamic path', () => {
    it('', async () => {
      const method = 'get';
      const url = '/accounts/123/transactions/456';
      const params = {
        acctId: '123',
        txnId: '456',
      };
      const query = { type: 'something', limit: '100' };
      const headers = { authorization: 'Bearer' };
      const body = undefined;

      const request = chai.request(app.getHandler())[`${method}`](url);
      if (query) request.query(query);
      if (headers) Object.entries((hdr, val) => request.set(hdr, val));
      if (body) request.send(body);

      const result = await request;
      // console.log((result.status, result.headers, result.body));

      expect(result.status).to.equal(200);

      expect(result.headers).to.haveOwnProperty('powered-by', 'xeno');
      expect(result.headers).to.haveOwnProperty('content-type', 'application/json');

      expect(result.body.req).to.haveOwnProperty('method', method);
      expect(result.body.req).to.haveOwnProperty('url', url);
      if (params) expect(result.body.req.params).to.deep.equal(params);
      if (query) expect(result.body.req).to.deep.haveOwnProperty('query', query);
      if (headers) {
        Object.entries((hdr, val) => {
          expect(result.body.req.headers).to.haveOwnProperty(hdr, val);
        });
      }
      if (body) expect(result.body.req.body).to.deep.equal(body);
    });
  });
});
