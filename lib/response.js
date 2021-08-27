class Response {
  constructor(response) {
    this.raw = response;
    this.body = undefined;
    this.sent = false;
  }


  status(sts) {
    if (sts) {
      this.raw.statusCode = sts;
    }
    return this.raw.statusCode;
  }

  header(hdr, val) {
    if (typeof val !== 'undefined') {
      return this.raw.setHeader(hdr, val);
    }
    return this.raw.getHeader(hdr);
  }

  headers(hdrs) {
    if (hdrs) {
      Object.entries(hdrs).forEach(([hdr, val]) => this.raw.setHeader(hdr, val));
      return this.raw.getHeaders();
    }
    return this.raw.getHeaders();
  }
}

module.exports = {
  Response,
};
