const findMyWay = require('find-my-way');

class Router {
  constructor() {
    this.router = findMyWay();
  }

  addRoute(route) {
    const { method = 'get', url } = route;
    this.router.on(method.toUpperCase(), url, async (req, res, params) => ({ route, params }));
  }

  lookup(req) {
    // TODO: 404 and 405
    return this.router.lookup(req);
  }
}



module.exports = {
  Router,
};