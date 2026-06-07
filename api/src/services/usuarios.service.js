import supabase from '../db/supabase.js'

export async function login(dni, password) {
	const { data, error } = await supabase
		.from('usuarios')
		.select('dni, nombre_comp, ano, especialidad, curso, password, about_me')
		.eq('dni', dni)
		.eq('password', password)
		.maybeSingle()
	if (error) throw error
	return data || null
}

export async function register(user) {
	const { data, error: existsError } = await supabase
		.from('usuarios')
		.select('dni')
		.eq('dni', user.dni)
		.limit(1)
	if (existsError) throw existsError
	if (data && data.length) throw new Error('El usuario ya existe')

	const payload = {
		dni: user.DNI ?? user.dni,
		nombre_comp: user.nombreComp ?? user.nombre_comp,
		ano: user.ano,
		especialidad: user.especialidad,
		curso: user.curso,
		password: user.password
	}
	const { error } = await supabase.from('usuarios').insert(payload)
	if (error) throw error
	return true
}

export async function getUserByDni(dni) {
	const { data, error } = await supabase
		.from('usuarios')
		.select('dni, nombre_comp, ano, especialidad, curso, password, about_me')
		.eq('dni', dni)
		.maybeSingle()
	if (error) throw error
	return data || null
}

export async function updateAboutMe(dni, about_me) {
	const { error } = await supabase
		.from('usuarios')
		.update({ about_me })
		.eq('dni', dni)
	if (error) throw error
	return true
}

export async function subirFotoPerfil(dni, buffer, mimetype) {
	const ext = mimetype.includes('png') ? 'png' : 'jpg'
	const storagePath = `perfiles/${dni}.${ext}`

	const { error: uploadError } = await supabase.storage
		.from('images')
		.upload(storagePath, buffer, { contentType: mimetype, upsert: true })
	if (uploadError) throw uploadError

	const { data } = supabase.storage.from('images').getPublicUrl(storagePath)
	const url = data.publicUrl

	const { error: updateError } = await supabase
		.from('usuarios')
		.update({ foto_perfil: url })
		.eq('dni', dni)
	if (updateError) throw updateError

	return url
}
