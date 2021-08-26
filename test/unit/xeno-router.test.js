const { expect } = require('chai');

const { Router } = require('../../lib/xeno-router');

describe('router', () => {
  describe('it finds different types of routes', () => {
    const r = new Router();

    // common methods
    r.on('GET', '/test', {});
    r.on('POST', '/test', {});
    r.on('PUT', '/test', {});
    r.on('PATCH', '/test', {});
    r.on('DELETE', '/test', {});

    // basic path
    r.on('GET', '/', {});

    // simple static path
    r.on('GET', '/static', {});

    // parameterised paths
    r.on('GET', '/accts/:acctId/txns/:txnId', {});

    // wildcard paths
    r.on('GET', '/proxy/*rest', {});

    // multiple methods
    r.on(['GET', 'PUT', 'POST'], '/multiple', {});

    const testData = [
      // common methods
      { testPath: '/test', method: 'GET', path: '/test' },
      { testPath: '/test', method: 'POST', path: '/test' },
      { testPath: '/test', method: 'PUT', path: '/test' },
      { testPath: '/test', method: 'PATCH', path: '/test' },
      { testPath: '/test', method: 'DELETE', path: '/test' },

      { testPath: '/', method: 'GET', path: '/' },

      { testPath: '/static', method: 'GET', path: '/static' },

      { testPath: '/accts/acctId/txns/txnId', method: 'GET', path: '/accts/:acctId/txns/:txnId' },
      { testPath: '/accts/-/txns/-', method: 'GET', path: '/accts/:acctId/txns/:txnId' },
      // { testPath: '/accts//txns/', method: 'GET', path: '/accts/:acctId/txns/:txnId' },

      // { testPath: '/proxy', method: 'GET', path: '/proxy/*rest' },
      { testPath: '/proxy/', method: 'GET', path: '/proxy/*rest' },
      { testPath: '/proxy/foo', method: 'GET', path: '/proxy/*rest' },
      { testPath: '/proxy/foo/bar', method: 'GET', path: '/proxy/*rest' },
      { testPath: '/proxy/foo/bar/baz', method: 'GET', path: '/proxy/*rest' },

      // { testPath: '/proxy-path', method: 'GET', path: '/proxy/*rest' },

      { testPath: '/unregistered', method: 'GET', error: 404 }, // unregistered path, existing method
      { testPath: '/unregistered', method: 'UNREGISTERED', error: 404 }, // unregistered path, non-existing method
      { testPath: '/static', method: 'UNREGISTERED', error: 405 }, // registered path, non-existing method
      { testPath: '/static', method: 'PATCH', error: 405 }, // registered path, existing method that is not allowed for the path
    ];
    testData.forEach((t) => {
      if (!t.error) {
        it(`${t.method} ${t.testPath} => ${t.path}`, () => {
          const result = r.find(t.method, t.testPath);
          expect(result.method).to.equal(t.method);
          expect(result.path).to.equal(t.path);
          // expect(result.route).to.deep.equal({ method: t.method, path: t.path });
        });
      } else {
        it(`${t.method} ${t.testPath} => ${t.error}`, () => {
          const result = r.find(t.method, t.testPath);
          expect(result.error.status).to.equal(t.error);
        });
      }
    });
  });

  describe('it returns params from path', () => {
    const r = new Router();

    // parameterised paths
    r.on('GET', '/accts/:acctId/txns/:txnId', {});
    r.on('GET', '/accts/:acctId/txns', {});
    r.on('GET', '/accts/:acctId', {});

    // wildcard paths
    r.on('GET', '/proxy/*rest', {});

    it('GET /accts/123/txns/456', () => {
      expect(r.find('GET', '/accts/123/txns/456').params).to.deep.equal({ acctId: '123', txnId: '456' });
    });
    it('GET /accts/-/txns/-', () => {
      expect(r.find('GET', '/accts/-/txns/-').params).to.deep.equal({ acctId: '-', txnId: '-' });
    });
    it('GET /accts/123/txns', () => {
      expect(r.find('GET', '/accts/123/txns').params).to.deep.equal({ acctId: '123' });
    });
    it('GET /accts/123', () => {
      expect(r.find('GET', '/accts/123').params).to.deep.equal({ acctId: '123' });
    });

    it('GET /proxy/foo', () => {
      expect(r.find('GET', '/proxy/foo').params).to.deep.equal({ rest: '/foo' });
    });
    it('GET /proxy/foo/bar', () => {
      expect(r.find('GET', '/proxy/foo/bar').params).to.deep.equal({ rest: '/foo/bar' });
    });
  });

  describe('it returns route data', () => {
    const r = new Router();

    const data = { hello: 'world' };
    r.on('GET', '/test/:testId', data);

    it('', () => {
      const result = r.find('GET', '/test/123');
      expect(result.method).to.equal('GET');
      expect(result.path).to.equal('/test/:testId');
      expect(result.params).to.deep.equal({ testId: '123' });
      expect(result.data).to.deep.equal(data);
    });
  });
});
