'use strict'

const debug = require('debug')('cpr:child-exec')
const dnodeProto = require('dnode-protocol')

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

const childScript = process.argv[2]
debug('started, setting up to execute', childScript)
let func
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
      childFunction = require(childScript)
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
