const { expect } = require('chai');

const { internal } = require('../../lib/xeno-router');

const { isStaticRoute, pathToRegex } = internal;

describe.skip('router', () => {
  describe('isStaticRoute()', () => {
    it('/ is static', () => {
      expect(isStaticRoute('/')).to.equal(true);
    });
    it('/hello is static', () => {
      expect(isStaticRoute('/hello')).to.equal(true);
    });
    it('/hello/world is static', () => {
      expect(isStaticRoute('/hello/world')).to.equal(true);
    });

    it('/* is dynamic', () => {
      expect(isStaticRoute('/*')).to.equal(false);
    });
    it('/hello* is dynamic', () => {
      expect(isStaticRoute('/hello*')).to.equal(false);
    });
    it('/hello/* is dynamic', () => {
      expect(isStaticRoute('/hello/*')).to.equal(false);
    });
    it('/:id is dynamic', () => {
      expect(isStaticRoute('/:id')).to.equal(false);
    });
    it('/account/:acctId is dynamic', () => {
      expect(isStaticRoute('/account/:acctId')).to.equal(false);
    });
    it('/account/:acctId/txn/:txnId is dynamic', () => {
      expect(isStaticRoute('/account/:acctId/txn/:txnId')).to.equal(false);
    });
  });

  describe('pathToRegex()', () => {
    it('sample to test pathToRegex', () => {
      const actual = pathToRegex('/accounts/:acctId/txns/:txnId').exec('/accounts/123/txns/456');
      expect(actual.groups).to.haveOwnProperty('acctId', '123');
      expect(actual.groups).to.haveOwnProperty('txnId', '456');
    });
    it('sample to test pathToRegex', () => {
      const actual = pathToRegex('/accounts/:acctId/txns/:txnId').exec('/accounts/123/txns');
      expect(actual).to.equal(null);
    });
  });
});
