function splitUrl(url) {
  let uri = url;
  let search = '';

  const qsIdx = url.indexOf('?');
  if (qsIdx > -1) {
    search = url.slice(qsIdx + 1);
    uri = url.substr(0, qsIdx);
  }
  return { uri, search };
}


class Request {
  constructor(request, opts = {}) {
    const { uri, search } = splitUrl(request.url);
    const query = opts.querystringParser(search);

    this.method = request.method.toLowerCase();
    this.originalUrl = request.url;
    this.uri = uri;
    this.url = uri;
    this.search = search;
    this.query = query;
    this.headers = request.headers;
    this.params = {};
    this.body = undefined;
    this.route = undefined;
  }
}

module.exports = {
  Request,
};
