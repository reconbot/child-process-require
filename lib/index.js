'use strict'

const debug = require('debug')('cpr:main')
const execa = require('execa')
const dnodeProto = require('dnode-protocol')

const childExecScript = require.resolve('./child-exec')

function unwrapRejection (message) {
  const data = message.data
  const error = message.error
  if (data) {
    return data
  }
  if (!error) { throw new Error('Rejection recieved without data or errors!') }
  const err = new Error(error.message)
  Object.assign(err, error)
  return err
}

function controlProcess (child, args) {
  // This isn't defined well but the test-child-process-fork-close test is super revealing
  // it shows that we always get the message, an exit and then a close event in that order
  // https://github.com/nodejs/node/blob/master/test/parallel/test-child-process-fork-close.js

  return new Promise((resolve, reject) => {
    let finished = false
    const proto = dnodeProto({
      resolve: (data) => {
        finished = true
        resolve(data)
      },
      reject: (err) => {
        finished = true
        reject(unwrapRejection(err))
      }
    })
    proto.on('request', req => child.send(req))
    child.on('message', msg => proto.handle(msg))

    proto.on('remote', remote => {
      debug('IPC ready, sending arguments')
      remote.func.apply(null, args)
    })

    proto.start()

    child.then(() => {
      if (finished) { return }
      debug('child has exited without resolving promise')
      reject(new Error('child has exited without resolving promise'))
    }, err => {
      if (finished) { return }
      debug('child has failed without resolving promise', err)
      reject(err)
    })
  })
}

module.exports = function childProcessRequire (childScript, opts) {
  opts = Object.assign({
    nodeBin: process.argv[0],
    requires: [],
    env: {}
  }, opts)
  const requires = opts.requires.join(',')
  const args = [childExecScript, childScript, requires]
  debug('opts.env', opts.env)
  const env = Object.assign({}, process.env, opts.env)
  const execOptions = {
    env,
    stdio: ['inherit', 'inherit', 'inherit', 'ipc']
  }
  debug(`Starting child with`, opts.nodeBin, args.join(', '))
  return function () {
    const funcArgs = [].slice.apply(arguments)
    return controlProcess(execa(opts.nodeBin, args, execOptions), funcArgs)
  }
}
