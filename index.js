var from = require('from2')
var varint = require('varint')
var nextTick = process.nextTick
module.exports = Sparse

function Sparse(opts) {
  if (!(this instanceof Sparse)) return new Sparse(opts)
  if (!opts) opts = {}
  this._read = opts.read
}

Sparse.prototype.search = function (q) {
  q = q.toLowerCase()
  var self = this
  var riset = new Set, rfqueue = [], rfset = new Set
  var lqueue = [], queue = []
  var readNext = null, readSize = -1, meta = null
  self._getMeta(function (err, m) {
    meta = m
    for (var i = 0; i < meta.lookup.length; i++) {
      if (meta.lookup[i] >= q) break
    }
    // todo: check for duplicate lookup names
    lqueue.push('l'+Math.max(0,i-1))
    if (readNext) read(readSize, readNext)
    readNext = null
  })
  return from.obj(read)

  function read(size, next) {
    if (!meta) {
      readSize = size
      readNext = next
      return
    }
    if (queue.length > 0) {
      return next(null, queue.shift())
    } else if (rfqueue.length > 0) {
      var rfile = rfqueue.shift()
      self._read(rfile, function (err, buf) {
        rfset.delete(rfile)
        var offset = 0
        while (offset < buf.length) {
          var id = varint.decode(buf, offset)
          offset += varint.decode.bytes
          var flen = varint.decode(buf, offset)
          offset += varint.decode.bytes
          if (riset.has(id)) {
            riset.delete(id)
            var payload = buf.slice(offset, offset+flen)
            queue.push(parsePayload(payload))
            //console.log(id, parsePayload(payload))
          }
          offset += flen
        }
        read(size, next)
      })
    } else if (lqueue.length > 0) {
      var lfile = lqueue.shift()
      self._read(lfile, function (err, buf) {
        var offset = 0
        while (offset < buf.length) {
          var klen = varint.decode(buf, offset)
          offset += varint.decode.bytes
          var key = buf.slice(offset, offset+klen).toString()
          offset += klen
          var id = varint.decode(buf, offset)
          offset += varint.decode.bytes
          if (key.startsWith(q)) {
            riset.add(id)
            var rfile = getRecordFile(meta, id)
            if (!rfset.has(rfile)) rfqueue.push(rfile)
            rfset.add(rfile)
          }
        }
        read(size, next)
      })
    } else {
      next(null, null)
    }
  }
}

Sparse.prototype._getMeta = function (cb) {
  var self = this
  if (self._meta) return nextTick(cb, null, self._meta)
  self._read('meta.json', function (err, src) {
    if (err) return cb(err)
    self._meta = JSON.parse(src.toString())
    cb(null, self._meta)
  })
}

function getRecordFile(meta, id) {
  for (var i = 0; i < meta.record.length; i++) {
    if (meta.record[i] >= id) break
  }
  return 'r' + Math.max(0, i-1)
}

function parsePayload(buf) {
  var offset = 0
  var nameLen = varint.decode(buf, offset)
  offset += varint.decode.bytes
  var name = buf.slice(offset, offset+nameLen).toString()
  offset += nameLen
  var longitude = buf.readFloatBE(offset)
  offset += 4
  var latitude = buf.readFloatBE(offset)
  offset += 4
  var cc1Len = varint.decode(buf, offset)
  offset += varint.decode.bytes
  var countryCode = buf.slice(offset, offset+cc1Len).toString()
  offset += cc1Len
  var cc2Len = varint.decode(buf, offset)
  offset += varint.decode.bytes
  var cc2 = buf.slice(offset, offset+cc2Len).toString()
  offset += cc2Len
  var admin1Len = varint.decode(buf, offset)
  offset += varint.decode.bytes
  var admin1 = buf.slice(offset, offset+admin1Len).toString()
  offset += admin1Len
  var admin2Len = varint.decode(buf, offset)
  offset += varint.decode.bytes
  var admin2 = buf.slice(offset, offset+admin2Len).toString()
  offset += admin2Len
  var admin3Len = varint.decode(buf, offset)
  offset += varint.decode.bytes
  var admin3 = buf.slice(offset, offset+admin3Len).toString()
  offset += admin3Len
  var admin4Len = varint.decode(buf, offset)
  offset += varint.decode.bytes
  var admin4 = buf.slice(offset, offset+admin4Len).toString()
  offset += admin4Len
  var population = varint.decode(buf, offset)
  offset += varint.decode.bytes
  var elevation = varint.decode(buf, offset)
  offset += varint.decode.bytes
  return {
    name, longitude, latitude,
    countryCode, cc2, admin1, admin2, admin3, admin4,
    population, elevation,
  }
}
