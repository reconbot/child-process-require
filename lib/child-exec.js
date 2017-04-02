'use strict'

const debug = require('debug')('cpr:child-exec')
const dnodeProto = require('dnode-protocol')

// For babel-node export default syntax
function requireWithDefault (obj) {
  if (typeof obj === 'object' && typeof obj.default === 'function') {
    debug('default export detected')
    return obj.default
  }
  return obj
}

function wrapError (data) {
  if (!(data instanceof Error)) {
    return { data }
  }
  const error = {
    message: data.message,
    stack: data.stack
  }
  Object.assign(error, data)
  return { error }
}

if (!process.send) {
  throw new Error('"process.send" is not available, cannot communicate via nodejs IPC')
}

const childScript = process.argv[2]
if (!childScript) {
  throw new Error('No childScript specified')
}

debug('started', process.argv.join(', '))

// Require packages
const pkgs = process.argv[3].split(',')
pkgs.forEach(pkg => {
  if (!pkg) { return }
  debug('pre-requiring', pkg)
  require(pkg)
})

// Setup dnode over ipc
let func // this can't be set until after we're connected
const proto = dnodeProto({
  func: function () {
    debug('recieving arguments')
    func.apply(null, arguments)
  }
})
process.on('message', args => proto.handle(args))
proto.on('request', req => process.send(req))

proto.on('remote', function (remote) {
  debug('IPC ready')
  const resolve = remote.resolve
  const reject = err => remote.reject(wrapError(err))
  func = function () {
    let childFunction
    try {
      debug('Requiring', childScript)
      childFunction = requireWithDefault(require(childScript))
    } catch (error) {
      reject(error)
      process.exit(1)
    }

    let returnValue
    try {
      debug('executing')
      returnValue = childFunction.apply(null, arguments)
    } catch (error) {
      reject(error)
      process.exit(1)
    }
    Promise.resolve(returnValue)
      .then((data) => {
        debug('resolving', data)
        resolve(data)
      }, (error) => {
        debug('rejecting', error)
        reject(error)
      })
      .then(() => process.exit(0))
  }
})

proto.start()
