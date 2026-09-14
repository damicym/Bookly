import supabase from '../db/supabase.js'

/**
 * Registra el chat en el historial del usuario si no existe.
 * created_at lo pone Supabase con DEFAULT now() y nunca se actualiza.
 */
export async function upsertChat(idUsuario, idContacto) {
	const { data, error } = await supabase
		.from('chats')
		.upsert(
			{ id_usuario: idUsuario, id_contacto: idContacto },
			{ onConflict: 'id_usuario,id_contacto', ignoreDuplicates: true }
		)
		.select()
		.maybeSingle()
	if (error) throw error
	return data
}

/**
 * Devuelve el historial de chats de un usuario.
 * Orden: primero los que tienen mensajes (por ultimo_mensaje desc),
 * después los que no tienen mensajes (por created_at desc).
 */
export async function getChatsByUsuario(idUsuario) {
	const { data, error } = await supabase
		.from('chats')
		.select(`
			id,
			id_contacto,
			created_at,
			ultimo_mensaje,
			contacto:usuarios!chats_id_contacto_fkey (
				dni,
				nombre_comp,
				ano,
				especialidad,
				foto_perfil
			)
		`)
		.eq('id_usuario', idUsuario)
		.order('ultimo_mensaje', { ascending: false, nullsFirst: false })
		.order('created_at',     { ascending: false })
	if (error) throw error
	return (data ?? []).map(row => ({
		id:             row.id,
		id_contacto:    row.id_contacto,
		created_at:     row.created_at,
		ultimo_mensaje: row.ultimo_mensaje,
		nombre_comp:    row.contacto?.nombre_comp ?? '',
		ano:            row.contacto?.ano ?? null,
		especialidad:   row.contacto?.especialidad ?? null,
		foto_perfil:    row.contacto?.foto_perfil ?? null
	}))
}

/**
 * Devuelve todos los mensajes de los últimos `limite` chats del usuario,
 * agrupados por dni del contacto. Se usa para el prefetch al cargar la página.
 */
export async function getMensajesDeChats(idUsuario, limite = 20) {
	// 1. Obtener los últimos N contactos
	const { data: chats, error: errChats } = await supabase
		.from('chats')
		.select('id_contacto')
		.eq('id_usuario', idUsuario)
		.order('ultimo_mensaje', { ascending: false, nullsFirst: false })
		.order('created_at',     { ascending: false })
		.limit(limite)
	if (errChats) throw errChats
	if (!chats || chats.length === 0) return {}

	const contactos = chats.map(c => c.id_contacto)

	// 2. Traer todos los mensajes de esas conversaciones en una sola query
	const { data: mensajes, error: errMsg } = await supabase
		.from('mensajes')
		.select('id, id_emisor, id_receptor, contenido, fecha_envio, leido')
		.or(
			contactos.map(dni =>
				`and(id_emisor.eq.${idUsuario},id_receptor.eq.${dni}),` +
				`and(id_emisor.eq.${dni},id_receptor.eq.${idUsuario})`
			).join(',')
		)
		.order('fecha_envio', { ascending: true })
	if (errMsg) throw errMsg

	// 3. Agrupar por contacto
	const resultado = {}
	for (const dni of contactos) resultado[dni] = []
	for (const msg of (mensajes ?? [])) {
		const contacto = msg.id_emisor === idUsuario ? msg.id_receptor : msg.id_emisor
		if (resultado[contacto]) resultado[contacto].push(msg)
	}
	return resultado
}
