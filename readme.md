# sparse-geonames-search

search through [sparse geonames data][sparse-geonames-ingest] without downloading the whole archive

[sparse-geonames-ingest]: https://github.com/peermaps/sparse-geonames-ingest

# example

``` js
var { Transform, pipeline } = require('stream')
var fs = require('fs')
var path = require('path')
var dir = process.argv[2]

var cities = require('sparse-geonames-search')({
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
```

# usage

```
usage: sparse-geonames-search DIR [QUERY...]

Search for records matching QUERY based on the data located in DIR.

```

# api

``` js
var search = require('sparse-geonames-search')
```

## var s = search(opts)

Create a new instance `s` from:

* `opts.read(file, cb)` - read the complete contents of `file`,
providing the result in `cb(err, buf)`.

## var stream = s.search(query)

Return a readable `stream` of geoname results in objectMode for geonames data matching the string
`query`.

Each `row` from the stream has these fields: 

* row.id
* row.name
* row.longitude
* row.latitude
* row.countryCode
* row.cc2
* row.admin1
* row.admin2
* row.admin3
* row.admin4
* row.population
* row.elevation

## s.getRecord(id, cb)

Get a record by its `id` as `cb(err, record)`.

# install

```
npm install sparse-geonames-search
```

# license

bsd

