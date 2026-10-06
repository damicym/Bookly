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

		const io = req.app.get('io')
		if (io) {
			io.to(id_receptor).emit('nuevo-mensaje', {
				id:         mensaje.id,
				idEmisor:   mensaje.id_emisor,
				idReceptor: mensaje.id_receptor,
				contenido:  mensaje.contenido,
				fechaEnvio: mensaje.fecha_envio,
				leido:      mensaje.leido
			})
		}

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
