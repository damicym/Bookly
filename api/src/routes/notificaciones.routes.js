import { Router } from 'express'
import * as notifCtrl from '../controllers/notificaciones.controller.js'

const router = Router()

// GET /api/notificaciones/:dni — notificaciones pendientes del usuario
router.get('/:dni', notifCtrl.getPendientes)

// PATCH /api/notificaciones/:id/leer — marcar una como leída
router.patch('/:id/leer', notifCtrl.marcarLeida)

// PATCH /api/notificaciones/:dni/leer-todas — marcar todas como leídas
router.patch('/:dni/leer-todas', notifCtrl.marcarTodasLeidas)

export default router
