var { Transform, pipeline } = require('stream')
var fs = require('fs')
var path = require('path')
var dir = process.argv[2]

var cities = require('../')({
  read: (file,cb) => fs.readFile(path.join(dir,file),cb)
})
pipeline(
  cities.search(process.argv.slice(3).join(' ')),
  Transform({
    objectMode: true,
    transform: (row,enc,next) => next(null, JSON.stringify(row)+'\n')
  }),
  process.stdout,
  (err) => { if (err) console.error(err) }
)
