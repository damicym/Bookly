import * as chatsService from '../services/chats.service.js'

/**
 * POST /api/chats/upsert
 */
export async function upsertChat(req, res) {
	try {
		const { id_usuario, id_contacto } = req.body
		if (!id_usuario || !id_contacto)
			return res.status(400).json({ error: 'id_usuario e id_contacto son requeridos' })
		if (id_usuario === id_contacto)
			return res.status(400).json({ error: 'Un usuario no puede chatear consigo mismo' })
		const data = await chatsService.upsertChat(id_usuario, id_contacto)
		res.status(200).json(data)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}

/**
 * GET /api/chats/:dniUsuario
 */
export async function getChatsByUsuario(req, res) {
	try {
		const { dniUsuario } = req.params
		const chats = await chatsService.getChatsByUsuario(dniUsuario)
		res.json(chats)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}

/**
 * GET /api/chats/:dniUsuario/mensajes?limite=20
 * Devuelve todos los mensajes de los últimos N chats del usuario,
 * agrupados por dni del contacto. { "dni1": [...], "dni2": [...] }
 */
export async function getMensajesDeChats(req, res) {
	try {
		const { dniUsuario } = req.params
		const limite = parseInt(req.query.limite) || 20
		const data = await chatsService.getMensajesDeChats(dniUsuario, limite)
		res.json(data)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}
