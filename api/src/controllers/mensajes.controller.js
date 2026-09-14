import * as mensajesService from '../services/mensajes.service.js'

/**
 * POST /api/mensajes
 * Body: { id_emisor, id_receptor, contenido }
 * Guarda un mensaje nuevo.
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
 * Devuelve la conversación entre dos usuarios, ordenada por fecha_envio asc.
 * También marca como leídos los mensajes recibidos por dniUsuario.
 */
export async function getMensajes(req, res) {
	try {
		const { dniUsuario, dniContacto } = req.params
		// Primero marca como leídos los mensajes que le envió el contacto al usuario
		await mensajesService.marcarLeidos(dniUsuario, dniContacto)
		const mensajes = await mensajesService.getMensajes(dniUsuario, dniContacto)
		res.json(mensajes)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}
