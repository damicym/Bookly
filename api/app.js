import express from "express"
import morgan from "morgan"
import cors from "cors"
import { config } from "./config.js"
import usuariosRoutes from "./src/routes/usuarios.routes.js"
import librosRoutes from "./src/routes/libros.routes.js"
import publicacionesRoutes from "./src/routes/publicaciones.routes.js"
import deseadosRoutes from "./src/routes/deseados.routes.js"

const app = express()

app.set('port', config.PORT)

// Desactivar caché durante desarrollo
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
    next()
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.use(cors())

// Health check
app.use('/v1', (req, res) => {
    res.status(200).json({ message: 'API is working!' })
})

// Routes
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/libros', librosRoutes)
app.use('/api/publicaciones', publicacionesRoutes)
app.use('/api/deseados', deseadosRoutes)

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint not found' })
})

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({ error: 'Internal server error' })
})

export default app