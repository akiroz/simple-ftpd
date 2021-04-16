'use strict'
/*
---
PASV:
  rfc: 'https://tools.ietf.org/html/rfc959'
  help: PASV (open passive data connection)
  auth: true
  data: false
  responses:
    - 227 Entering passive mode (%s,%d,%d)
    - 425 Too many connections. Can't open data channel
    - 425 Rejected data connection from foreign address %s:%s
    - 421 Passive data channel timed out
    - 503 PASV not allowed after EPSV ALL
*/

const net = require("net");
const pfy = require('../util/promisify')
const sequence = require('async-sequence')

function getPort([base, range]) {
    return new Promise((rsov) => {
        const port = base + Math.floor(Math.random() * range);
        const srv = net.createServer();
        srv.listen(port, (err) => {
            if(err) rsov(getPort());
            else {
                srv.once("close", () => rsov(port));
                srv.close();
            }
        });
    });
}

// @todo: proper errors, check ports, check host, etc.
// @todo: limit dataServer to 1 connection ?
const PASV = sequence(function * PASV (dataServer) {
  // ensure the dataServer is listening
  if (!dataServer.listening) {
    try {
      let port = this.dataPort
      if(Array.isArray(port)) {
        port = yield getPort(port)
      }
      yield pfy(dataServer.listen).call(dataServer, port, this.dataHost)
    } catch (err) {
      return this.respond(425, err.message)
    }
  }

  // get the assigned port
  const port = dataServer.address().port
  const p1 = port / 256 | 0
  const p2 = port % 256

  // tell the client we're listening
  yield this.respond(
    227, 'Entering passive mode (%s,%d,%d)',
    this.host.split('.').join(','), p1, p2
  )

  // return a (promised) socket
  return pfy(dataServer.once, true).call(dataServer, 'connection')
})

exports.auth = true
exports.handler = PASV
exports.help = 'PASV (open passive data connection)'
