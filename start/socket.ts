import Ws from 'App/Services/Ws'
Ws.boot()

/**
 * Listen for incoming socket connections
 */
Ws.io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Emit berita ketika client terhubung
  socket.emit('news', { hello: 'world' })

  // Listener untuk menerima dan mengirimkan progress setiap step
  socket.on('stepProgress', (data) => {
    console.log(`Step progress received: ${data.stepName}, progress: ${data.percent}%`)

    // Emit progress spesifik untuk step ini
    Ws.io.emit('stepProgress', {
      stepName: data.stepName,
      percent: data.percent,
      message: data.message,
    })
  })

  // Listener untuk menerima dan mengirimkan progress keseluruhan
  socket.on('overallProgress', (data) => {
    console.log(`Overall progress received: ${data.percent}%`)

    // Emit progress keseluruhan untuk semua client
    Ws.io.emit('overallProgress', {
      percent: data.percent,
      message: data.message,
    })
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})
