import supabase from '../db/supabase.js'
import { fetchBooksByIds, mapBooksById } from '../db/helpers.js'
import { uploadPublicationImage } from '../utils/imgParser.js'

const PERFILES_BUCKET = 'images/perfiles'

/**
 * Si le llega idLibro null, es porque es un libro nuevo -> agreagrlo a la db
 * Si no le llega null, es porque el libro ya existe -> verificar que el nombre coincida, sino throwear error
 */
export async function createPublication(publication, dniVendedor) {
	let idLibro = publication?.libro?.id || null
	let imagenUrl = publication?.imagen || null
	if (publication?.imageFile) {
		imagenUrl = await uploadPublicationImage(publication.imageFile, PERFILES_BUCKET)
	}

	if (idLibro === null) {
		if (!publication.libro || !publication.libro.nombre) {
			// por ahora editorial, ano, y materia son opcionales en la DB. Cualquier cosa repensarlo.
			throw new Error('Para crear una publicación con un libro nuevo, se debe proporcionar al menos el nombre del libro')
		}
		const { data: newLibroData, error: errNew } = await supabase
			.from('libros')
			.insert({
				nombre: publication.libro?.nombre || 'Libro sin nombre',
				materia: publication.libro?.materia || null,
				ano: publication.libro?.ano || null,
				editorial: publication.libro?.editorial || null
			})
			.select()
			.maybeSingle()
		if (errNew) throw errNew
		idLibro = newLibroData.id
	} else {
		const { data: libroData, error: errL } = await supabase
			.from('libros')
			.select('nombre')
			.eq('id', idLibro)
			.maybeSingle()
		if (errL && errL.code !== 'PGRST116') throw errL // Ignorar error de no encontrado
		if (!libroData) throw new Error('El libro especificado no existe')
		if (publication.libro?.nombre && publication.libro.nombre !== libroData.nombre) {
			throw new Error('El nombre del libro no coincide con el ID proporcionado')
		}
		idLibro = libroData.id
	}
	const insertPub = {
		id_vendedor: dniVendedor,
		precio: publication.precio,
		id_libro: idLibro,
		status: publication.status ?? 1,
		estado_libro: publication.estadoLibro || publication.estado_libro || 'Sin especificar',
		fecha: publication.fecha || new Date().toISOString(),
		descripcion: publication.descripcion || null,
		imagen: imagenUrl
	}

	const { data, error } = await supabase
		.from('publicaciones')
		.insert(insertPub)
		.select()
		.maybeSingle()
	if (error) throw error
	return data || null
}

/**
 * no le llega nada del libro, la web no te deja editar eso desde la publicacion
 * returnea true pero porque sí, creo q no se usa
 */
export async function updatePublication(idPublicacion, precio, estadoLibro, descripcion, imagen, imageFile = null) {
	const { data: pub } = await supabase
		.from('publicaciones')
		.select('id_libro, imagen')
		.eq('id', idPublicacion)
		.maybeSingle()
	if (!pub) throw new Error('Publicación no encontrada')

	const idLibro = pub.id_libro
	if (!idLibro) throw new Error('La publicación no tiene un libro asociado')
	
	let imagenUrl = imagen ? imagen : null
	if (imageFile) {
		try {
			imagenUrl = await uploadPublicationImage(imageFile, PERFILES_BUCKET)
		} catch (err) {
			console.error('Error al subir la imagen optimizada:', err)
			throw new Error('No se pudo procesar la imagen proporcionada')
		}
	}

	const { error } = await supabase
		.from('publicaciones')
		.update({ precio, estado_libro: estadoLibro, descripcion, imagen: imagenUrl })
		.eq('id', idPublicacion)
	if (error) throw error
	return true
}

export async function deletePublication(idPublicacion) {
	const { error } = await supabase.from('publicaciones').delete().eq('id', idPublicacion)
	if (error) throw error
	return true
}

export async function deleteBookAndPublications(id) {
	const { error: errP } = await supabase.from('publicaciones').delete().eq('id_libro', id)
	if (errP) throw errP
	const { error: errL } = await supabase.from('libros').delete().eq('id', id)
	if (errL) throw errL
	return true
}

export async function getPublicationsOfUser(dni) {
	const { data: pubs, error } = await supabase
		.from('publicaciones')
		.select('*')
		.eq('id_vendedor', dni)
		.order('fecha', { ascending: false })
	if (error) throw error
	const ids = [...new Set((pubs || []).map(p => p.id_libro))].filter(Boolean)
	const booksMap = await mapBooksById(ids)
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

export async function getPublicationById(id) {
	const { data: pub, error } = await supabase
		.from('publicaciones')
		.select('*')
		.eq('id', id)
		.maybeSingle()
	if (error) throw error
	if (!pub) return null
	const book = await supabase
		.from('libros')
		.select('id, nombre, materia, ano, editorial')
		.eq('id', pub.id_libro)
		.maybeSingle()
	if (book.error) throw book.error
	const libro = book.data || {}
	return {
		id: pub.id,
		id_libro: pub.id_libro,
		nombre: libro.nombre || null,
		materia: libro.materia || null,
		ano: libro.ano || null,
		editorial: libro.editorial || null,
		estado_libro: pub.estado_libro,
		precio: pub.precio,
		descripcion: pub.descripcion,
		id_vendedor: pub.id_vendedor,
		fecha: pub.fecha,
		status: pub.status,
		imagen: pub.imagen
	}
}

export async function getFeed(limit = -1) {
	// ahora devuelve publicaciones completas con campos del libro en el nivel principal
	let query = supabase.from('publicaciones').select('*').eq('status', 1).order('fecha', { ascending: false })
	if (limit > 0) query = query.limit(limit)
	const { data: pubs, error } = await query
	if (error) throw error
	const ids = [...new Set((pubs || []).map(p => p.id_libro))].filter(Boolean)
	const booksMap = await mapBooksById(ids)
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

export async function getRecommendations(ano, especialidad) {
	let query = supabase.from('publicaciones').select('*').eq('status', 1).order('fecha', { ascending: false })
	const { data: pubs, error } = await query
	if (error) throw error
	const ids = [...new Set((pubs || []).map(p => p.id_libro))].filter(Boolean)
	const books = await fetchBooksByIds(ids)
	const booksMap = new Map(books.map(b => [b.id, b]))
	const filtered = (pubs || []).filter(p => {
		const b = booksMap.get(p.id_libro)
		if (!b) return false
		if (b.ano != ano) return false
		if (!especialidad) return true
		return (b.materia || '').toLowerCase().includes((especialidad || '').toLowerCase())
	})
	return filtered.map(p => {
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

export async function getRecommendationsByYear(ano) {
	const { data: pubs, error } = await supabase
		.from('publicaciones')
		.select('*')
		.order('fecha', { ascending: false })
	if (error) throw error
	const ids = [...new Set((pubs || []).map(p => p.id_libro))].filter(Boolean)
	const booksMap = await mapBooksById(ids)
	const filtered = (pubs || []).filter(p => {
		const b = booksMap.get(p.id_libro)
		return b && b.ano == ano
	})
	return filtered.map(p => {
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
