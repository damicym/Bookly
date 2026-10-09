import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import app from './app.js'

const server = http.createServer(app)

// ── Socket.io ─────────────────────────────────────────────────────────────────
// Cada usuario se une a una "room" con su propio DNI al conectarse.
// Cuando alguien envía un mensaje, el servidor emite el evento solo al receptor.
const io = new SocketIOServer(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
})

io.on('connection', (socket) => {
    const dni = socket.handshake.query.dni
    if (dni) {
        socket.join(dni)
        console.log(`[ws] ${dni} conectado (socket ${socket.id})`)
    }

    socket.on('disconnect', () => {
        console.log(`[ws] socket ${socket.id} desconectado`)
    })
})

// Exponemos `io` para que los controllers puedan emitir eventos
app.set('io', io)

// ── Iniciar servidor ──────────────────────────────────────────────────────────
server.listen(app.get('port'), () => {
    console.clear()
    console.log(`   - Server is running on port ${app.get('port')}`)
    console.log(`   - API base URL: http://localhost:${app.get('port')}/api`)
    console.log(`   - WebSocket: ws://localhost:${app.get('port')}`)
})
