import supabase from '../db/supabase.js'
import { fetchBooksByIds, mapBooksById } from '../db/helpers.js'

export async function createPublication(publication, dniVendedor) {
	let idLibro = publication.idLibro || publication.id_libro || null

	if (!idLibro && publication.libro && publication.libro.nombre) {
		const { data: existing } = await supabase
			.from('libros')
			.select('id')
			.eq('nombre', publication.libro.nombre)
			.limit(1)
			.maybeSingle()
		if (existing && existing.id) idLibro = existing.id
		else {
			const insertLibro = {
				nombre: publication.libro.nombre,
				materia: publication.libro.materia || null,
				ano: publication.libro.ano || null,
				editorial: publication.libro.editorial || null
			}
			const { data: newLibro, error: errLibro } = await supabase
				.from('libros')
				.insert(insertLibro)
				.select('id')
				.maybeSingle()
			if (errLibro) throw errLibro
			idLibro = newLibro.id
		}
	}

	const insertPub = {
		id_vendedor: dniVendedor,
		precio: publication.precio,
		id_libro: idLibro,
		status: publication.status ?? 1,
		estado_libro: publication.estadoLibro || publication.estado_libro || 'Sin especificar',
		fecha: publication.fecha || new Date().toISOString(),
		descripcion: publication.descripcion || null,
		imagen: publication.imagen || null
	}

	const { data, error } = await supabase
		.from('publicaciones')
		.insert(insertPub)
		.select()
		.maybeSingle()
	if (error) throw error
	return data || null
}

export async function updatePublicationFull(idPublicacion, libroFields, precio, estadoLibro, descripcion, imagen) {
	const { data: pub } = await supabase
		.from('publicaciones')
		.select('id_libro')
		.eq('id', idPublicacion)
		.maybeSingle()
	if (!pub) throw new Error('Publicación no encontrada')

	const idLibro = pub.id_libro
	if (libroFields) {
		const { error: errL } = await supabase
			.from('libros')
			.update({
				nombre: libroFields.nombre,
				materia: libroFields.materia,
				ano: libroFields.ano,
				editorial: libroFields.editorial
			})
			.eq('id', idLibro)
		if (errL) throw errL
	}

	const { error } = await supabase
		.from('publicaciones')
		.update({ precio, estado_libro: estadoLibro, descripcion, imagen })
		.eq('id', idPublicacion)
	if (error) throw error
	return true
}

export async function updatePublicationByBookId(idLibro, precio, estadoLibro, descripcion) {
	const updates = {}
	if (precio !== undefined) updates.precio = precio
	if (estadoLibro !== undefined) updates.estado_libro = estadoLibro
	if (descripcion !== undefined) updates.descripcion = descripcion
	const { error } = await supabase.from('publicaciones').update(updates).eq('id_libro', idLibro)
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
