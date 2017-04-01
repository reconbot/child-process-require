const debug = require('debug')('cpr:main')
const invariant = require('invariant')
const execa = require('execa')
const childExecScript = require.resolve('./child-exec')

function parseMessage (message) {
  const { data, error } = message
  invariant(data || error, 'Message recieved without data or errors!')
  if (data) { return data }
  const err = new Error(error.message)
  Object.assign(err, error)
  return err
}

function controlProcess (cp, args) {
  debug('Sending argument', args)
  cp.send(args)
  return new Promise((resolve, reject) => {
    let output
    cp.once('message', message => {
      debug('got message', message)
      output = parseMessage(message)
    })
    cp.on('close', () => {
      debug('child has closed')
      cp.then(result => {
        if (output) {
          resolve(output)
        } else {
          reject(new Error('Childprocess exited before resolving a value'))
        }
      }, (err) => {
        reject(output || err)
      })
    })
  })
}

module.exports = function childProcessRequire (childScript) {
  const nodeBin = process.argv[0]
  const args = [childExecScript, childScript]
  const options = { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] }
  debug(`execing ${childScript}`)
  return function () {
    const funcArgs = [].slice.apply(arguments)
    return controlProcess(execa(nodeBin, args, options), funcArgs)
  }
}
