import { Router } from 'express'
import * as resenasCtrl from '../controllers/resenas.controller.js'

const router = Router()

// GET /api/resenas/receptor/:dni  — debe ir ANTES de /redactor/:dni para evitar conflictos
router.get('/receptor/:dni', resenasCtrl.getResenasByReceptor)

// GET /api/resenas/redactor/:dni
router.get('/redactor/:dni', resenasCtrl.getResenasByRedactor)

export default router
