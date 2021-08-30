# Xeno
Super Minimal NodeJS Web Server Framework

- [Xeno](#xeno)
  - [Install](#install)
  - [Usage](#usage)
    - [API](#api)
      - [`Xeno`](#xeno-1)
      - [`app.addRoute(options)`:](#appaddrouteoptions)
      - [`app.addHook(hook, handler)`](#appaddhookhook-handler)
      - [`app.start(<http(s) module>, <http(s) opts>, port, callback)`](#appstarthttps-module-https-opts-port-callback)
      - [`Handler signature`](#handler-signature)
      - [`ctx`:](#ctx)
      - [Hooks](#hooks)

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
const app = new Xeno(options);
```

`options`
```js
{
  errorHandler: async (err, ctx) => {} // async function that will be called when any error occurs
}
```

#### `app.addRoute(options)`:
Add a route to the application.

`options`
```js
{
  method: 'post', // defaults to get when not provided
  url :'test/:testId', // suppports `/static`, `/dynamic/:param`, `/wildcard*`
  handler: async (ctx) => {}, // optional async handler function executed on route
  some: 'route metadata', // arbitrary metadata to add to `ctx.req.route`
  other: 'property',
}
```

#### `app.addHook(hook, handler)`
Add a hook to be executed at different phases of request.
```js
hook : String // onRequest, onParse, onRoute, onSend, onResponse
handler : async (ctx) => {} // async function
```


#### `app.start(<http(s) module>, <http(s) opts>, port, callback)`
Start the server.

#### `Handler signature`
Handlers (route and hook) are called with a `ctx` object.

#### `ctx`:
```js
ctx = {
  req: {
    raw: <Raw NodeJS request>,
    method: String, // request method
    originalUrl: String, // request url (path + query string)
    url | uri: String, // path component

    search: String, // ?query=string
    query: Object, // querystring as object
    params: Object, // dynamic path params
    headers: Object, // request headers

    rawBody = [Buffer | String],
    body: Any,

    route: { // metadata about the current route
      method: String,
      path: String,
      *: Any,
    }
  },
  res: {
    status(Number), // set reponse status code
    header(String, String), // get or set response header name and value
    headers(Object), // get all or set multiple response headers
    removeHeader(String), // remove a response header
    body: [Object | String | Buffer | Stream], // set response body
  },
}
```

#### Hooks
> TODO
