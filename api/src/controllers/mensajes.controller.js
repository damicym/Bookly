import * as mensajesService from '../services/mensajes.service.js'

/**
 * POST /api/mensajes
 */
export async function enviarMensaje(req, res) {
	try {
		const { id_emisor, id_receptor, contenido } = req.body
		if (!id_emisor || !id_receptor || !contenido?.trim()) {
			return res.status(400).json({ error: 'id_emisor, id_receptor y contenido son requeridos' })
		}
		if (id_emisor === id_receptor) {
			return res.status(400).json({ error: 'Un usuario no puede enviarse mensajes a sí mismo' })
		}
		const mensaje = await mensajesService.enviarMensaje(id_emisor, id_receptor, contenido.trim())
		res.status(201).json(mensaje)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}

/**
 * GET /api/mensajes/:dniUsuario/:dniContacto
 */
export async function getMensajes(req, res) {
	try {
		const { dniUsuario, dniContacto } = req.params
		const antes = req.query.antes || null
		await mensajesService.marcarLeidos(dniUsuario, dniContacto)
		const mensajes = await mensajesService.getMensajes(dniUsuario, dniContacto, antes)
		res.json(mensajes)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}

/**
 * PATCH /api/mensajes/:id
 * Edita el contenido de un mensaje propio.
 * Body: { id_emisor, contenido }
 */
export async function editarMensaje(req, res) {
	try {
		const id = parseInt(req.params.id, 10)
		const { id_emisor, contenido } = req.body

		if (!id_emisor || !contenido?.trim()) {
			return res.status(400).json({ error: 'id_emisor y contenido son requeridos' })
		}

		const mensaje = await mensajesService.editarMensaje(id, id_emisor, contenido.trim())

		if (!mensaje) {
			return res.status(404).json({ error: 'Mensaje no encontrado o no autorizado' })
		}

		res.json(mensaje)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}

/**
 * DELETE /api/mensajes/:id
 * Soft-delete de un mensaje propio.
 * Query param: id_emisor (para validar propiedad)
 */
export async function eliminarMensaje(req, res) {
	try {
		const id        = parseInt(req.params.id, 10)
		const id_emisor = req.query.id_emisor

		if (!id_emisor) {
			return res.status(400).json({ error: 'id_emisor es requerido' })
		}

		const deleted = await mensajesService.eliminarMensaje(id, id_emisor)

		if (!deleted) {
			return res.status(404).json({ error: 'Mensaje no encontrado o no autorizado' })
		}

		res.json({ ok: true, id_receptor: deleted.id_receptor })	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}


/**
 * GET /api/mensajes/:dniUsuario/no-leidos
 * Devuelve { "dniEmisor": count } con los mensajes no leídos del usuario.
 */
export async function getNoLeidos(req, res) {
	try {
		const { dniUsuario } = req.params
		const conteos = await mensajesService.getNoLeidosPorEmisor(dniUsuario)
		res.json(conteos)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}
