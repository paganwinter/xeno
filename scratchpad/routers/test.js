/* eslint-disable no-console */

// import { RoadRunner } from '@parisholley/road-runner';
const findMyWay = require('find-my-way');
const { RoadRunner } = require('@parisholley/road-runner');
// const KoaGenRouter = require('./koa-tree-generic');
const XenoRouter = require('../../lib/xeno-router').Router;

const rr = new RoadRunner();
const fmw = findMyWay();
const xr = new XenoRouter();

const routes = [
  { method: 'GET', url: '/accounts' },
  { method: 'POST', url: '/accounts' },
  { method: 'PATCH', url: '/something' },
  { method: 'GET', url: '/this/is/a/very/long/path/for/a/uri/phew' },
  { method: 'GET', url: '/accounts/:acctId/txns/:txnId' },
  // doesn't work with road-runner
  // { method: 'GET', url: '/accounts/acctId/txns/txnId' },
  // doesn't work with koa-tree
  // { method: 'GET', url: '/proxy/*' },
  // works differently with find-my-way and koa-tree, doesn't work with road-runner
  { method: 'GET', url: '/proxy/*all' },
  // doesn't work with koa-tree
  // { method: 'GET', url: '/wild/*/card' },
];

const requests = [
  { method: 'GET', url: '/accounts', status: 200 },
  { method: 'POST', url: '/accounts', status: 200 },
  { method: 'PATCH', url: '/accounts', status: 405 },
  { method: 'DELETE', url: '/accounts', status: 405 },
  { method: 'GET', url: '/this/is/a/very/long/path/for/a/uri/phew', status: 200 },
  { method: 'GET', url: '/accounts/123/txns/456?type=some&limit=100', status: 200 },
  { method: 'GET', url: '/accounts/acctId/txns/txnId', status: 200 },
  { method: 'GET', url: '/proxy/this', status: 200 },
  { method: 'GET', url: '/proxy/this/is', status: 200 },
  { method: 'GET', url: '/invalid', status: 404 },
  { method: 'INVALID', url: '/invalid', status: 404 },

  // { method: 'GET', url: '/wild/*/card' },
  // { method: 'GET', url: '/wild/something/card' },
  // { method: 'GET', url: '/wild/some/thing/card' },
];

// Register routes
routes.forEach((rt) => {
  const data = { name: `${rt.method} ${rt.url}` };
  fmw.on(rt.method, rt.url, () => {}, data); // data = store
  rr.addRoute(rt.method, rt.url, data); // data = value
  xr.on(rt.method, rt.url, data);
});


// Test routes
requests.forEach((req) => {
  console.log(req.method, req.url, req.status);
  const url = (req.url.indexOf('?') > -1) ? req.url.substr(0, req.url.indexOf('?')) : req.url;

  // find-my-way returns handler, store, and params
  const fmwRoute = fmw.find(req.method, url);
  if (fmwRoute) console.log(200, fmwRoute.store.name, fmwRoute.params);
  else { console.log(404); }

  // road-runner returns handle and params
  const rrRoute = rr.findRoute(req.method, url);
  if (rrRoute) console.log(200, rrRoute.value.name, rrRoute.params);
  else { console.log(404); }


  // koa-tree-generic returns route and params
  const xenoRoute = xr.find(req.method, url);
  // console.log(koaRoute.route);
  if (!xenoRoute.error) console.log(200, xenoRoute.data.name, xenoRoute.params);
  else { console.log(xenoRoute.error.status); }

  console.log();
});
