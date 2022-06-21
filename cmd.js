#!/usr/bin/env node
var { Transform, pipeline } = require('stream')
var fs = require('fs')
var path = require('path')
var minimist = require('minimist')
var argv = minimist(process.argv.slice(2), {
  alias: { h: 'help', v: 'version' },
})
if (argv.version) return console.log(require('./package.json').version)
if (argv.help) return usage()
var dir = argv._[0]
if (dir === undefined) return usage()

var cities = require('./')({
  read: (file,cb) => fs.readFile(path.join(dir,file),cb)
})
pipeline(
  cities.search(argv._.slice(1).join(' ')),
  Transform({
    objectMode: true,
    transform: (row,enc,next) => next(null, JSON.stringify(row)+'\n')
  }),
  process.stdout,
  (err) => { if (err) console.error(err) }
)

function usage() {
  console.log(`
    usage: sparse-geonames-search DIR [QUERY...]

    Search for records matching QUERY based on the data located in DIR.

  `.trim().replace(/^ {4}/mg,'') + '\n')
}
