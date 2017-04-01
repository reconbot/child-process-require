const debug = require('debug')('cpr:child-exec')
const childScript = process.argv[2]
debug('Loading', childScript)

function send (data) {
  if (data instanceof Error) {
    const error = {
      message: data.message,
      stack: data.stack
    }
    Object.assign(error, data)
    return process.send({ error })
  }
  process.send({ data })
}

const time = 500
const timeout = setTimeout(() => {
  send(new Error(`Error communicating with Parent, no arguments recieved in ${time}ms`))
}, time)

process.on('message', args => {
  debug('Got arguments', args)
  clearTimeout(timeout)
  let childFunction
  try {
    childFunction = require(childScript)
  } catch (error) {
    send(error)
    process.exit(1)
  }

  childFunction.apply(null, args).then(data => {
    send(data)
    process.exit(0)
  }, error => {
    send(error)
    process.exit(1)
  })
})
