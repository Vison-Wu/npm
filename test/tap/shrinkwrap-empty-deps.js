'use strict'

const common = require('../common-tap.js')
const fs = require('fs')
const mkdirp = require('mkdirp')
const mr = require('npm-registry-mock')
const npm = require('../../lib/npm.js')
const osenv = require('osenv')
const path = require('path')
const rimraf = require('rimraf')
const ssri = require('ssri')
const test = require('tap').test

const pkg = path.resolve(__dirname, 'shrinkwrap-empty-deps')

const EXEC_OPTS = { cwd: pkg }

const json = {
  author: 'Rockbert',
  name: 'shrinkwrap-empty-deps',
  version: '0.0.0',
  dependencies: {},
  devDependencies: {}
}

test('setup', function (t) {
  cleanup()
  mkdirp.sync(pkg)
  fs.writeFileSync(
    path.join(pkg, 'package.json'),
    JSON.stringify(json, null, 2)
  )

  process.chdir(pkg)
  t.end()
})

test('returns a list of removed items', function (t) {
  mr({ port: common.port }, function (er, s) {
    common.npm(
      [
        '--registry', common.registry,
        '--loglevel', 'silent',
        'shrinkwrap'
      ],
      EXEC_OPTS,
      function (err, code, stdout, stderr) {
        t.ifError(err, 'shrinkwrap ran without issue')
        t.notOk(code, 'shrinkwrap ran without raising error code')

        fs.readFile(path.resolve(pkg, 'npm-shrinkwrap.json'), function (err, desired) {
          t.ifError(err, 'read npm-shrinkwrap.json without issue')
          t.same(
            {
              'name': 'shrinkwrap-empty-deps',
              'version': '0.0.0',
              'createdWith': `npm@${npm.version}`,
              'lockfileVersion': npm.lockfileVersion,
              'packageIntegrity': ssri.fromData(JSON.stringify(json, null, 2), {
                algorithms: ['sha512']
              }).toString()
            },
            JSON.parse(desired),
            'shrinkwrap handled empty deps without exploding'
          )

          s.close()
          t.end()
        })
      }
    )
  })
})

test('cleanup', function (t) {
  cleanup()

  t.end()
})

function cleanup () {
  process.chdir(osenv.tmpdir())
  rimraf.sync(pkg)
}
