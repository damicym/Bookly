import { Router } from 'express'
import * as resenasCtrl from '../controllers/resenas.controller.js'

const router = Router()

// POST /api/resenas  — insertar nueva reseña
router.post('/', resenasCtrl.createResena)

// PATCH /api/resenas/:id  — completar una reseña pendiente (flujo legacy)
router.patch('/:id', resenasCtrl.updateResena)

// GET /api/resenas/receptor/:dni
router.get('/receptor/:dni', resenasCtrl.getResenasByReceptor)

// GET /api/resenas/redactor/:dni
router.get('/redactor/:dni', resenasCtrl.getResenasByRedactor)

export default router
