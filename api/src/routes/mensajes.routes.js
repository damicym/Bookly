import { Router } from 'express'
import * as mensajesCtrl from '../controllers/mensajes.controller.js'

const router = Router()

// POST /api/mensajes — envía un mensaje nuevo
router.post('/', mensajesCtrl.enviarMensaje)

// GET /api/mensajes/:dniUsuario/:dniContacto — conversación entre dos usuarios
router.get('/:dniUsuario/:dniContacto', mensajesCtrl.getMensajes)

export default router
