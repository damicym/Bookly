import supabase from '../db/supabase.js'
import { uploadPublicationImage } from '../utils/imgParser.js'

const PERFILES_BUCKET = 'images/perfiles'

export async function subirFotoPerfil(dni, imageFile) {
	let imagenUrl = null
	if (imageFile) {
		imagenUrl = await uploadPublicationImage(publication.imageFile, PERFILES_BUCKET)
	} else {
		console.log("No recibe imageFile at subirFotoPerfil")
		return null
	}

	const { error: updateError } = await supabase
		.from('usuarios')
		.update({ foto_perfil: imagenUrl })
		.eq('dni', dni)
	if (updateError) throw updateError

	return imagenUrl
}

export async function deleteFotoPerfil(dni) {
	const { error: updateError } = await supabase
		.from('usuarios')
		.update({ foto_perfil: null })
		.eq('dni', dni)
	if (updateError) throw updateError
	return true
}

export async function login(dni, password) {
	const { data, error } = await supabase
		.from('usuarios')
		.select('dni, nombre_comp, ano, especialidad, curso, password, about_me, foto_perfil')
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
		.select('dni, nombre_comp, ano, especialidad, curso, password, about_me, foto_perfil')
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
