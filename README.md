# Xeno

- [Xeno](#xeno)
  - [Install](#install)
  - [Usage](#usage)
    - [API](#api)

## Install
```bash
npm i git@github.service.anz:parasurv/xeno.git
```

## Usage
Check [samples](/samples) for usage.

### API
```js
const app = new Xeno();
```
Create an app instance.

`app.addRoute(method, url, handler)`: Add a route to the application.

`app.onRequest(handler)`: Add a handler for `request received` event

`app.onParse(handler)`: Add a handler for on `request parsed` event

`app.onRoute(handler)`: Add a handler for `route identified` event

`app.onResponse(handler)`: Add a handler for `response sent` event

`app.start(<http(s) module>, <http(s) opts>, port, callback)`

