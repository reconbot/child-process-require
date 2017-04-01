# Child Process Require
[![Build Status](https://travis-ci.org/reconbot/child-process-require.svg?branch=master)](https://travis-ci.org/reconbot/child-process-require)
Require a function that returns a promise and run it in a child process.

This is a way to take lengthy cpu intensive tasks and run them in a child process. This allows you to take advantage of multiple cpu cores. Child Process Require (`cpr`) will let you require a function from a file and run it in a new `node` process each time you call it. Almost as if it were all in a single process.

- Each execution of a required function starts a new `node` process
- The function's return value will be wrapped in `Promise`.
- Arguments can be any JSON data type or callback function.
- Environment variables are shared
- `stdin`, `stdout` and `stderr` are shared (so `console.log`, `console.error`, etc will work)
- Crashes will become promise rejections
- Rejections of error objects will be recreated with stack traces
- If you `process.exit` or crash an attempt will be made to stop the child process

It works like this
```js
// work.js should have a single function exported that returns a value or a Promise.
// It can have data or functions for arguments
module.exports = function add(a, b) {
  return Promise.resolve(a + b)
}
```

```js
// main.js can now start a child processes to do the work.
// `require.resolve` returns the absolute path of `work.js`
// the absolute path is required for for child process require to work
const cpr = require('child-process-require')
const absolutePath = require.resolve('./work')
const work = cpr(absolutePath)

Promise.all([
  work(1, 2),
  work(2, 3),
  work(3, 4)
]).then(console.log)
// [3, 5, 7]
```

Arguments and return values are passed between node processes using NodeJs's [child process IPC](https://nodejs.org/api/process.html#process_process_send_message_sendhandle_options_callback) channel and the [dnode protocol](https://github.com/substack/dnode-protocol). This means all objects will be JSON stringified and parsed. Rejected Error objects will be converted back into error objects with their message, stack traces and all iterable properties preserved. The dnode protocol allows for circular references and callback functions. (Functions who's return value isn't needed.)

### Todo
- Better API docs
- Expose `execa`'s options including timeouts
- Test to see if alternative nodejs runtimes work (etc, `babel-node`)
- See if we can extend dnode-protocol to handle promises, dates and error objects
- See if we can support some subset of arbituary exports of the requied file
- See what people think
