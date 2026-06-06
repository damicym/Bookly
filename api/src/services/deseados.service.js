import supabase from '../db/supabase.js'
import { mapBooksById } from '../db/helpers.js'

export async function addToWishlist(dni, idPublicacion) {
	const { data: exists, error: err1 } = await supabase
		.from('deseados')
		.select('dni_usuario')
		.eq('dni_usuario', dni)
		.eq('id_publicacion', idPublicacion)
		.limit(1)
	if (err1) throw err1
	if (exists && exists.length) return true
	const { error } = await supabase.from('deseados').insert({ dni_usuario: dni, id_publicacion: idPublicacion })
	if (error) throw error
	return true
}

export async function removeFromWishlist(dni, idPublicacion) {
	const { error } = await supabase
		.from('deseados')
		.delete()
		.eq('dni_usuario', dni)
		.eq('id_publicacion', idPublicacion)
	if (error) throw error
	return true
}

export async function getWishlistIds(dni) {
	if (!dni) return []
	const { data, error } = await supabase
		.from('deseados')
		.select('id_publicacion')
		.eq('dni_usuario', dni)
	if (error) throw error
	return (data || []).map(d => d.id_publicacion)
}

export async function getFavoritePublications(dni) {
	const ids = await getWishlistIds(dni)
	if (!ids || ids.length === 0) return []
	const { data: pubs, error } = await supabase.from('publicaciones').select('*').in('id', ids).order('fecha', { ascending: false })
	if (error) throw error
	const bookIds = [...new Set((pubs || []).map(p => p.id_libro))].filter(Boolean)
	const booksMap = await mapBooksById(bookIds)
	return (pubs || []).map(p => {
		const libro = booksMap.get(p.id_libro) || {}
		return {
			id: p.id,
			id_libro: p.id_libro,
			nombre: libro.nombre || null,
			materia: libro.materia || null,
			ano: libro.ano || null,
			editorial: libro.editorial || null,
			estado_libro: p.estado_libro,
			precio: p.precio,
			descripcion: p.descripcion,
			id_vendedor: p.id_vendedor,
			fecha: p.fecha,
			status: p.status,
			imagen: p.imagen
		}
	})
}
