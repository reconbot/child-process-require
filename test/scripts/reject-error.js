module.exports = function () {
  const err = new Error('Failure!')
  err.code = 404
  return Promise.reject(err)
}
