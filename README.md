# Xeno
Super Minimal NodeJS Web Server Framework

- [Xeno](#xeno)
  - [Install](#install)
  - [Usage](#usage)
    - [API](#api)
      - [`Xeno`](#xeno-1)
      - [`app.addRoute({ method, url, handler, config })`:](#appaddroute-method-url-handler-config-)
      - [`app.start(<http(s) module>, <http(s) opts>, port, callback)`](#appstarthttps-module-https-opts-port-callback)
      - [`Handler signature`](#handler-signature)
      - [`ctx`:](#ctx)

## Install
```bash
npm i git@github.service.anz:parasurv/xeno.git
```

## Usage
Check [samples](/samples) for usage.

### API
#### `Xeno`
Create an app instance.
```js
const app = new Xeno();
```

#### `app.addRoute({ method, url, handler, config })`:
Add a route to the application.<br />

<!--
#### `app.onRequest(handler)`
Add a handler for `request received` event

#### `app.onParse(handler)`
Add a handler for `request parsed` event

#### `app.onRoute(handler)`:
Add a handler for `route identified` event

#### `app.onSend(handler)`:
Add a handler for `sending response` event

#### `app.onResponse(handler)`:
Add a handler for `response sent` event
-->

#### `app.start(<http(s) module>, <http(s) opts>, port, callback)`
Start the server

#### `Handler signature`
Handlers are called with a `ctx` object.

#### `ctx`:
```js
ctx = {
  req: {
    originalUrl: String,
    method: String,
    url | uri | path: String,
    query: Object,
    params: Object,
    headers: Object,
    body: [Object | String],
    route: { // metadata about the current route
      method: String,
      path: String,
      config: Object,
    }
  },
  res: {
    status(Number), // set reponse status code
    header(String, String), // set response header name and value
    headers(Object), // set multiple response headers
    body: [Object | String | Buffer | Stream], // set response body
  },
}
```