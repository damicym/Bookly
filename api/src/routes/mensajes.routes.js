import { Router } from 'express'
import * as mensajesCtrl from '../controllers/mensajes.controller.js'

const router = Router()

// POST /api/mensajes — envía un mensaje nuevo
router.post('/', mensajesCtrl.enviarMensaje)

// GET /api/mensajes/:dniUsuario/no-leidos — conteo de no leídos por emisor
// IMPORTANTE: debe ir antes de /:dniUsuario/:dniContacto
router.get('/:dniUsuario/no-leidos', mensajesCtrl.getNoLeidos)

// GET /api/mensajes/:dniUsuario/:dniContacto — conversación entre dos usuarios
router.get('/:dniUsuario/:dniContacto', mensajesCtrl.getMensajes)

export default router
