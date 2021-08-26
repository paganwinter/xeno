const debug = require('debug')('xeno:router');

const Node = require('./tree');

// const httpMethods = require('http').METHODS;

class Router {
  constructor(opts = {}) {
    if (!(this instanceof Router)) {
      return new Router(opts);
    }
    this.trees = {};
    this.opts = opts;
  }

  on(method = 'GET', path, data) {
    if (path[0] !== '/') {
      throw new Error('path must begin with `/`');
    }

    const methods = Array.isArray(method) ? method : [method];
    const handle = { method, path, data };

    methods.forEach((mth) => {
      mth = mth.toUpperCase(); // eslint-disable-line no-param-reassign
      if (!this.trees[`${mth}`]) {
        this.trees[`${mth}`] = new Node();
      }
      this.trees[`${mth}`].addRoute(path, handle);
    });

    return this;
  }


  find(method, path) {
    method = method.toUpperCase(); // eslint-disable-line no-param-reassign

    debug(method, path);
    // method | path | status
    // -------|------|-------
    // yes    | yes  |  OK
    // no     | yes  |  405
    // yes    | no   |  404
    // no     | no   |  404

    const methodTree = this.trees[`${method}`];

    // if method is found
    if (methodTree) {
      debug('method found in tree');
      const pathNode = methodTree.search(path);

      // if method is found and path is found under it, return route
      if (pathNode.handle !== null) {
        debug('path found under method');
        const { handle, params: paramsArr } = pathNode;
        const params = paramsArr.reduce((acc, item) => {
          acc[`${item.key}`] = item.value;
          return acc;
        }, {});
        return {
          method: handle.method, path: handle.path, params, data: handle.data,
        };
      }
    }

    // if method is not found, or path is not found under it
    debug('method or path not found');

    // check if path exists
    const allMethods = Object.keys(this.trees);
    const allowedMethodsForPath = allMethods.filter((m) => {
      const pathFound = (this.trees[`${m}`].search(path).handle !== null);
      return pathFound;
    });
    const pathExists = (allowedMethodsForPath.length > 0);

    // if path is found under any method, return 405
    if (pathExists) {
      debug('path exists - 405');
      const error = new Error('Method Not Allowed');
      error.status = 405;
      error.allowedMethods = allowedMethodsForPath;
      return { error };
    }

    // if path is not found under any method, return 404
    debug('path does not exist - 404');
    const error = new Error('Not Found');
    error.status = 404;
    return { error };
  }
}

module.exports = {
  Router,
};
