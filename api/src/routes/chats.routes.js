import { Router } from 'express'
import * as chatsCtrl from '../controllers/chats.controller.js'

const router = Router()

// POST /api/chats/upsert
router.post('/upsert', chatsCtrl.upsertChat)

// GET /api/chats/:dniUsuario/mensajes?limite=20 — debe ir ANTES de /:dniUsuario
router.get('/:dniUsuario/mensajes', chatsCtrl.getMensajesDeChats)

// GET /api/chats/:dniUsuario
router.get('/:dniUsuario', chatsCtrl.getChatsByUsuario)

export default router
