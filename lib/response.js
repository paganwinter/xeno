class Response {
  constructor(response) {
    this.raw = response;
    this.body = undefined;
    this.sent = false;
  }

  // statusCode
  // write()
  // end()
  // setHeader('headername', value) sets an HTTP header value
  // getHeader('headername') gets an HTTP header already set
  // getHeaders() get a copy of the HTTP headers already set
  // removeHeader('headername') removes an HTTP header already set
  // hasHeader('headername') return true if the response has that header set
  // getHeaderNames() get the list of the names of the HTTP headers already set
  // headersSent() return true if the headers have already been sent to the client

  status(sts) {
    if (sts) {
      this.raw.statusCode = sts;
    }
    return this.raw.statusCode;
  }

  header(hdr, val) {
    if (typeof val !== 'undefined') {
      if (this.raw.headersSent) return false;
      return this.raw.setHeader(hdr, val);
    }
    return this.raw.getHeader(hdr);
  }

  headers(hdrs) {
    if (hdrs) {
      if (this.raw.headersSent) return false;
      Object.entries(hdrs).forEach(([hdr, val]) => this.raw.setHeader(hdr, val));
      return this.raw.getHeaders();
    }
    return this.raw.getHeaders();
  }

  removeHeader(hdr) {
    if (this.raw.headersSent) return;
    this.raw.removeHeader(hdr);
  }

  headersSent() {
    return this.raw.headerSent;
  }

  write(data) {
    this.raw.write(data);
  }

  end(data) {
    this.raw.end(data);
  }

  send(data) {
    this.raw.end(data);
  }
}

module.exports = {
  Response,
};
