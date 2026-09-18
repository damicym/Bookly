import supabase from '../db/supabase.js'

/**
 * Guarda un mensaje nuevo y garantiza que ambas filas de chats existan
 * (la del emisor y la del receptor), actualizando ultimo_mensaje en paralelo.
 * Esto asegura que el receptor vea la conversación en su sidebar aunque
 * nunca haya iniciado el chat desde su lado.
 */
export async function enviarMensaje(idEmisor, idReceptor, contenido) {
	const ahora = new Date().toISOString()

	// 1. Insertar el mensaje
	const { data, error } = await supabase
		.from('mensajes')
		.insert({ id_emisor: idEmisor, id_receptor: idReceptor, contenido, fecha_envio: ahora, leido: false })
		.select()
		.maybeSingle()

	if (error) throw error

	// 2. Garantizar filas de chat para ambos lados en paralelo.
	//    Usamos el RPC de Supabase con raw SQL vía rpc o insertamos manualmente:
	//    - Si la fila no existe → INSERT (created_at = now(), ultimo_mensaje = ahora)
	//    - Si ya existe → UPDATE solo ultimo_mensaje
	await Promise.all([
		_upsertChatRow(idEmisor, idReceptor, ahora),
		_upsertChatRow(idReceptor, idEmisor, ahora)
	])

	return data
}

/**
 * Inserta la fila (id_usuario, id_contacto) en chats si no existe,
 * o actualiza ultimo_mensaje si ya existe.
 * Se hace en dos pasos separados para evitar problemas con el constraint
 * UNIQUE y el manejo de id serial en el upsert de Supabase.
 */
async function _upsertChatRow(idUsuario, idContacto, ultimoMensaje) {
	console.log(`[chats] _upsertChatRow START: ${idUsuario} → ${idContacto}`)

	// Intentar actualizar primero (caso más común: la fila ya existe)
	// .select() al final hace que Supabase devuelva las filas afectadas
	const { data: updated, error: errUpdate } = await supabase
		.from('chats')
		.update({ ultimo_mensaje: ultimoMensaje })
		.eq('id_usuario', idUsuario)
		.eq('id_contacto', idContacto)
		.select('id')

	console.log(`[chats] update result (${idUsuario}→${idContacto}):`, { updated, errUpdate })

	if (errUpdate) {
		console.error(`[chats] Error update (${idUsuario}→${idContacto}):`, errUpdate.message)
		return
	}

	// Si el update no afectó ninguna fila (array vacío), la fila no existía → insertar
	if (!updated || updated.length === 0) {
		console.log(`[chats] fila no existe, insertando (${idUsuario}→${idContacto})`)
		const { data: inserted, error: errInsert } = await supabase
			.from('chats')
			.insert({ id_usuario: idUsuario, id_contacto: idContacto, ultimo_mensaje: ultimoMensaje })
			.select('id')

		console.log(`[chats] insert result (${idUsuario}→${idContacto}):`, { inserted, errInsert })

		if (errInsert && errInsert.code !== '23505') {
			// 23505 = unique_violation: otra request ganó la carrera, no es error real
			console.error(`[chats] Error insert (${idUsuario}→${idContacto}):`, errInsert.message)
		}
	} else {
		console.log(`[chats] fila existía, actualizada (${idUsuario}→${idContacto}), id: ${updated[0]?.id}`)
	}
}

/**
 * Devuelve todos los mensajes entre dos usuarios, ordenados por fecha_envio asc.
 * La conversación es bidireccional: trae tanto los enviados como los recibidos.
 * Si se especifica 'antes', trae solo mensajes anteriores a esa fecha (para lazy loading).
 */
export async function getMensajes(dniUsuario, dniContacto, antes = null, limite = 50) {
	let query = supabase
		.from('mensajes')
		.select('id, id_emisor, id_receptor, contenido, fecha_envio, leido')
		.or(
			`and(id_emisor.eq.${dniUsuario},id_receptor.eq.${dniContacto}),` +
			`and(id_emisor.eq.${dniContacto},id_receptor.eq.${dniUsuario})`
		)
	
	if (antes) {
		// Cargar mensajes anteriores (lazy loading hacia arriba)
		query = query.lt('fecha_envio', antes)
			.order('fecha_envio', { ascending: false })
			.limit(limite)
	} else {
		// Carga inicial: últimos 50 mensajes
		query = query.order('fecha_envio', { ascending: false })
			.limit(limite)
	}
	
	const { data, error } = await query
	if (error) throw error
	
	// Invertir para orden cronológico ascendente
	return (data ?? []).reverse()
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
