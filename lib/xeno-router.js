function isStaticRoute(url) {
  if (url.endsWith('*')) return false;
  if (url.includes('/:')) return false;
  return true;
}

function pathToRegex(path) {
  // converts /accounts/*
  // to /\/accounts\/(.+)/
  if (path.endsWith('*')) {
    const reStr = path
      .replace(/\/$/g, '')
      .replace(/\*/, '(.+)');
    const re = new RegExp(`^${reStr}$`);
    return re;
  }

  // converts /accounts/:acctId/txns/:txnId
  // to /\/accounts\/(?<acctId>[^/]+)\/txns\/(?<txnId>[^/]+)/
  const reStr = path
    .replace(/\/$/g, '')
    .replace(/:([^/]+)/g, (...args) => `(?<${args[1]}>[^/]+)`);
  const re = new RegExp(`^${reStr}$`);
  return re;
}

class Router {
  constructor() {
    this.routes = [];
    this.staticRoutes = {};
    this.dynamicRoutes = {};
  }

  addRoute(route) {
    this.routes.push(route);

    if (isStaticRoute(route.url)) {
      if (!this.staticRoutes[route.url]) {
        this.staticRoutes[route.url] = {};
      }
      this.staticRoutes[route.url][route.method] = route;
      return;
    }

    if (!this.dynamicRoutes[route.url]) {
      const pathRegex = pathToRegex(route.url);
      this.dynamicRoutes[route.url] = {
        pattern: pathRegex,
      };
    }
    this.dynamicRoutes[route.url][route.method] = route;
  }


  find(req) {
    // try static routes first
    const matchedStaticUrlRoutes = this.staticRoutes[req.url];
    if (matchedStaticUrlRoutes) {
      const matchedRoute = matchedStaticUrlRoutes[req.method];
      if (!matchedRoute) {
        const err = new Error('Method Not Allowed');
        err.status = 405;
        throw err;
      }
      return { route: matchedRoute };
    }

    // dynamic routes
    let params = {};
    const matchedDynamicUrlRoutes = Object.values(this.dynamicRoutes).find((route) => {
      const match = route.pattern.exec(req.url);
      if (match) {
        params = match.groups;
        return true;
      }
      return false;
    });
    if (matchedDynamicUrlRoutes) {
      const matchedRoute = matchedDynamicUrlRoutes[req.method];
      if (!matchedRoute) {
        const err = new Error('Method Not Allowed');
        err.status = 405;
        throw err;
      }
      return { route: matchedRoute, params };
    }

    const err = new Error('Not Found');
    err.status = 404;
    throw err;
  }
}

module.exports = {
  Router,
  internal: {
    isStaticRoute,
    pathToRegex,
  },
};
