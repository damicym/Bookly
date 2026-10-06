import supabase from '../db/supabase.js'
import { uploadPublicationImage } from '../utils/imgParser.js'
import bcrypt from 'bcryptjs'

const PERFILES_BUCKET = 'images/perfiles'
const SALT_ROUNDS = 12

export async function subirFotoPerfil(dni, imageFile) {
	let imagenUrl = null
	if (imageFile) {
		// imageFile viene como objeto con .buffer y .mimetype (desde Multer)
		imagenUrl = await uploadPublicationImage(imageFile, PERFILES_BUCKET)
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
	// Traer el usuario sin filtrar por password (necesitamos comparar con bcrypt)
	const { data, error } = await supabase
		.from('usuarios')
		.select('dni, nombre_comp, ano, especialidad, curso, password, about_me, foto_perfil, ventas_cerradas')
		.eq('dni', dni)
		.maybeSingle()
	if (error) throw error
	if (!data) return null

	const storedPassword = data.password ?? ''
	const isHashed = storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2a$')

	let passwordOk = false

	if (isHashed) {
		// Contraseña ya hasheada (registrada desde la app) → comparar con bcrypt
		passwordOk = await bcrypt.compare(password, storedPassword)
	} else {
		// Contraseña en texto plano (inserts manuales / datos de prueba) → comparar directo
		// No se migra a hash para no romper los datos de seed/test
		passwordOk = storedPassword === password
	}

	if (!passwordOk) return null

	// No devolver el hash al cliente
	const { password: _, ...userSinPassword } = data
	return userSinPassword
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
		password: await bcrypt.hash(user.password, SALT_ROUNDS)
	}
	const { error } = await supabase.from('usuarios').insert(payload)
	if (error) throw error
	return true
}

export async function getUserByDni(dni) {
	const { data, error } = await supabase
		.from('usuarios')
		.select('dni, nombre_comp, ano, especialidad, curso, about_me, foto_perfil, ventas_cerradas')
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

export async function searchUsers(q) {
	const { data, error } = await supabase
		.from('usuarios')
		.select('dni, nombre_comp, ano, especialidad, curso, foto_perfil')
		.ilike('nombre_comp', `%${q}%`)
		.limit(10)
	if (error) throw error
	return data ?? []
}
