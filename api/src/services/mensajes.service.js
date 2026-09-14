import supabase from '../db/supabase.js'

/**
 * Guarda un mensaje nuevo y actualiza ultimo_mensaje en ambas filas de chats
 * (la del emisor y la del receptor) en paralelo.
 */
export async function enviarMensaje(idEmisor, idReceptor, contenido) {
	const ahora = new Date().toISOString()

	// Insertar el mensaje y actualizar ultimo_mensaje en los chats en paralelo
	const [{ data, error }, { error: errChats }] = await Promise.all([
		supabase
			.from('mensajes')
			.insert({ id_emisor: idEmisor, id_receptor: idReceptor, contenido, fecha_envio: ahora, leido: false })
			.select()
			.maybeSingle(),

		// Actualiza el campo en las filas de ambos participantes (si existen)
		supabase
			.from('chats')
			.update({ ultimo_mensaje: ahora })
			.or(
				`and(id_usuario.eq.${idEmisor},id_contacto.eq.${idReceptor}),` +
				`and(id_usuario.eq.${idReceptor},id_contacto.eq.${idEmisor})`
			)
	])

	if (error) throw error
	if (errChats) console.error('[mensajes] Error actualizando ultimo_mensaje:', errChats.message)

	return data
}

/**
 * Devuelve todos los mensajes entre dos usuarios, ordenados por fecha_envio asc.
 * La conversación es bidireccional: trae tanto los enviados como los recibidos.
 */
export async function getMensajes(dniUsuario, dniContacto) {
	const { data, error } = await supabase
		.from('mensajes')
		.select('id, id_emisor, id_receptor, contenido, fecha_envio, leido')
		.or(
			`and(id_emisor.eq.${dniUsuario},id_receptor.eq.${dniContacto}),` +
			`and(id_emisor.eq.${dniContacto},id_receptor.eq.${dniUsuario})`
		)
		.order('fecha_envio', { ascending: true })
	if (error) throw error
	return data ?? []
}

/**
 * Marca como leídos todos los mensajes que le enviaron al usuario en esa conversación.
 * Se llama cuando el usuario abre el chat con ese contacto.
 */
export async function marcarLeidos(idReceptor, idEmisor) {
	const { error } = await supabase
		.from('mensajes')
		.update({ leido: true })
		.eq('id_receptor', idReceptor)
		.eq('id_emisor', idEmisor)
		.eq('leido', false)
	if (error) throw error
	return true
}
