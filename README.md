# Child Process Require
Require a function that returns a promise and run it in a child process.

This was made as a way to take lengthy cpu intensive tasks and run them in a child process. Arguments and return values are passed using node's [child process IPC](https://nodejs.org/api/process.html#process_process_send_message_sendhandle_options_callback) channel. This means all objects will be JSON stringified and parsed. Rejected Error objects will be converted back into error objects with thier message, stack traces and all iterable properties preserved.


The requirements are as such

```js
// work.js should have a single function export that returns a promise
module.exports = function add(a, b) {
  return Promise.resolve(a + b)
}

// main.js can now spin up child processes to do the work.
const cpr = require('child-process-require')

// require.resolve returns the full path of work.js
const work = cpr(require.resolve('./work'))

Promise.all([
  work(1, 2),
  work(2, 3),
  work(3, 4)
]).then(console.log)
// [3, 5, 7]
```
