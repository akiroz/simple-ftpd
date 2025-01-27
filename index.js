'use strict'

const { createServer } = require('net')

const FTPSession = require('./lib/session')

function ftpd (opts, sessionCb) {
  if (typeof opts === 'string') {
    const [ host, port ] = opts.split(':')
    opts = { host: host, port: parseInt(port, 10) }
  }

  opts = Object.assign({
    host: '127.0.0.1',
    port: 1337,
    dataPort: 0,
    dataHost: '127.0.0.1',
    root: '/',
    maxConnections: 10,
    readOnly: true,
    debug: false
  }, opts)

  const ftpServer = createServer()
  ftpServer.maxConnections = opts.maxConnections

  if (sessionCb) {
    ftpServer.on('connection', (socket) => {
      const session = new FTPSession(socket, opts)
      session.accept(opts.greet).then(() => {
        sessionCb(session)
      })
    })

    ftpServer.listen(opts.port, opts.host)
  }

  return ftpServer
}

module.exports = ftpd
