function keepAlive (cb) {
  setTimeout(keepAlive, 1000)
}

keepAlive()

module.exports = function () {
  return Promise.resolve('Success!')
}
