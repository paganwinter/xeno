# Xeno

- [Xeno](#xeno)
  - [Install](#install)
  - [Usage](#usage)
    - [API](#api)
      - [`Xeno`](#xeno-1)

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

##### `app.addRoute(method, url, handler)`:
Add a route to the application.<br />

##### `app.onRequest(handler)`
Add a handler for `request received` event

##### `app.onParse(handler)`
Add a handler for `request parsed` event

##### `app.onRoute(handler)`:
Add a handler for `route identified` event

##### `app.onResponse(handler)`:
Add a handler for `response sent` event

##### `app.start(<http(s) module>, <http(s) opts>, port, callback)`
Start the server

##### `Handler signature`
Handlers are called with a `ctx` object.

##### `ctx`:
```js
ctx = {
  req: {
    method: String,
    url: String,
    query: Object,
    params: Object,
    headers: Object,
    body: [Object | String],
  },
  res: {
    status: Number,
    headers: Object,
    body: [Object | String | Buffer | Stream],
  },
}
```