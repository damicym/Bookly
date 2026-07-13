import { Router } from 'express'
import * as resenasCtrl from '../controllers/resenas.controller.js'

const router = Router()

// GET /api/resenas/redactor/:dni
router.get('/redactor/:dni', resenasCtrl.getResenasByRedactor)

export default router
