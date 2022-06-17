var pump = require('stream').pipeline
var through = require('through2')
var fs = require('fs')
var path = require('path')
var dir = process.argv[2]

var cities = require('../')({
  read: (file,cb) => fs.readFile(path.join(dir,file),cb)
  /*
  read: (file,cb) => {
    fs.readFile(path.join(dir,file),function (err,buf) {
      if (buf) console.log(file,buf.length)
      cb(err,buf)
    })
  }
  */
})
//cities.search(process.argv.slice(3).join(' '))
pump(
  cities.search(process.argv.slice(3).join(' ')),
  through.obj((row,enc,next) => next(null, JSON.stringify(row)+'\n')),
  process.stdout,
  (err) => { if (err) console.error(err) }
)
