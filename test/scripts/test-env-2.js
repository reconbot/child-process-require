module.exports = function () {
  const testEnv = process.env.testEnv
  const testEnv2 = process.env.testEnv2
  return Promise.resolve({ testEnv, testEnv2 })
}
