'use strict'

const assert = require('chai').assert
const childProcessRequire = require('../')

const cpr = (scriptName, opts) => childProcessRequire(require.resolve(`./scripts/${scriptName}`), opts)

describe('childProcessRequire', () => {
  it('resolves with data when the child resolves', () => {
    return cpr('basic')().then(response => {
      assert.equal(response, 'Success!')
    })
  })

  it('resolves with data when the child returns data', () => {
    return cpr('return')().then(response => {
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
    return cpr('arguments')(1, '2', null, [{}], true).then(response => {
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
      assert.equal(error.message, `child has exited without resolving promise`)
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

  it('allows functions as arguments', () => {
    let calledBack = false
    const cb = (input) => {
      calledBack = true
      assert.equal(input, 'DATA!')
    }
    return cpr('callback')(cb).then(() => {
      assert.isTrue(calledBack)
    })
  })

  it('allows circular data structures as arguments', () => {
    const args = { a: 1 }
    args.b = args
    return cpr('arguments')(args).then(response => {
      assert.deepEqual(response, [args])
    })
  })

  it('allow specifying a pre require', function () {
    this.timeout(10000)
    return cpr('babel-node', {
      requires: ['babel-register']
    })().then(response => {
      assert.equal(response, 'Success!')
    })
  })

  // This isn't a great test - maybe use babel-node when they can support us
  // https://github.com/babel/babel/issues/4554#issuecomment-290958986
  it('allow specifying the node binary', () => {
    return cpr('basic', {
      nodeBin: 'node'
    })().then(response => {
      assert.equal(response, 'Success!')
    })
  })

  it(`allow overwriting and inhereting `, () => {
    const testEnv2 = `parent-${Date.now()}`
    process.env.testEnv2 = testEnv2
    process.env.testEnv = 'parent-testEnv'
    const testEnv = `child-${Date.now()}`
    return cpr('test-env-2', {
      env: { testEnv }
    })().then(response => {
      assert.deepEqual(response, { testEnv, testEnv2 })
      assert.equal(process.env.testEnv, 'parent-testEnv')
    })
  })
})
