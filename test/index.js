const assert = require('chai').assert
const childProcessRequire = require('../')

const cpr = scriptName => childProcessRequire(require.resolve(`./scripts/${scriptName}`))

describe('childProcessRequire', () => {
  it('resolves with data when the child resolves', () => {
    return cpr('basic')().then(response => {
      assert.equal(response, 'Success!')
    })
  })

  it('rejects with data when the child rejects', () => {
    return cpr('reject-data')().then(() => {
      throw new Error('should not have resolved')
    }, data => {
      assert.deepEqual(data, { message: 'Failure!' })
    })
  })

  it('rejects with errors when the child rejects with errors', () => {
    return cpr('reject-error')().then(() => {
      throw new Error('should not have resolved')
    }, error => {
      assert.instanceOf(error, Error)
      assert.equal(error.message, 'Failure!')
      assert.include(error.stack, 'reject-error')
      assert.equal(error.code, 404)
    })
  })

  it('rejects with errors when the child throws with errors', () => {
    return cpr('throw-error')().then(() => {
      throw new Error('should not have resolved')
    }, error => {
      assert.instanceOf(error, Error)
      assert.equal(error.message, 'Failure!')
      assert.include(error.stack, 'throw-error')
    })
  })

  it(`gives stderr and stdout - this objectivly passes but isn't yet tested`)

  it('gives the local environment', () => {
    delete process.env.testEnv
    process.env.testEnv = Date.now()
    return cpr('test-env')().then(response => {
      assert.equal(response, process.env.testEnv)
    })
  })

  it('allows arguments', () => {
    return cpr('argument-script')(1, '2', null, [{}], true).then(response => {
      assert.deepEqual(response, [1, '2', null, [{}], true])
    })
  })

  it('rejects when there is a module execution error', () => {
    return cpr('module-error')().then(() => {
      throw new Error('should not have resolved')
    }, error => {
      assert.instanceOf(error, Error)
      assert.equal(error.message, 'Throwing during module exec')
    })
  })

  it('rejects when given a bad path', () => {
    return childProcessRequire('bad-path')().then(() => {
      throw new Error('should not have resolved')
    }, error => {
      assert.instanceOf(error, Error)
      assert.equal(error.message, `Cannot find module 'bad-path'`)
    })
  })

  it('rejects when the child exits before resolving', () => {
    return cpr('exit-early')().then(() => {
      throw new Error('should not have resolved')
    }, error => {
      assert.instanceOf(error, Error)
      assert.equal(error.message, `Childprocess exited before resolving a value`)
    })
  })

  it('rejects when the child dies', () => {
    return cpr('exit-bad')().then(() => {
      throw new Error('should not have resolved')
    }, error => {
      assert.instanceOf(error, Error)
      assert.include(error.message, 'Command failed')
    })
  })

  // reach goals!
  it('allows circular data structures as arguments')
  it('allows functions as arguments')
  it('provides an alternative communications channel')
})
