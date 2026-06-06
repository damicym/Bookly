import supabase from '../db/supabase.js'
import { fetchBooksByIds, mapBooksById } from '../db/helpers.js'
import { randomUUID } from 'crypto'
import sharp from 'sharp'

const PUBLICATIONS_BUCKET = 'images'
const MAX_IMAGE_WIDTH = 900
const MAX_IMAGE_HEIGHT = 1200
const WEBP_QUALITY = 78

async function toOptimizedWebp(imageFile) {
	if (!imageFile?.buffer || !imageFile.mimetype?.startsWith('image/')) {
		throw new Error('El archivo subido no es una imagen válida')
	}

	return sharp(imageFile.buffer, { failOn: 'none' })
		.rotate()
		.resize({
			width: MAX_IMAGE_WIDTH,
			height: MAX_IMAGE_HEIGHT,
			fit: 'inside',
			withoutEnlargement: true
		})
		.webp({ quality: WEBP_QUALITY })
		.toBuffer()
}

async function uploadPublicationImage(imageFile) {
	if (!imageFile) return null

	const filePath = `${randomUUID()}.webp`
	const webpBuffer = await toOptimizedWebp(imageFile)

	const { error } = await supabase.storage
		.from(PUBLICATIONS_BUCKET)
		.upload(filePath, webpBuffer, {
			contentType: 'image/webp',
			upsert: false
		})

	if (error) throw error

	const { data } = supabase.storage
		.from(PUBLICATIONS_BUCKET)
		.getPublicUrl(filePath)

	return data.publicUrl
}

export async function createPublication(publication, dniVendedor) {
	let idLibro = publication?.libro?.id || null
	let imagenUrl = publication?.imagen || null
	if (publication?.imageFile) {
		imagenUrl = await uploadPublicationImage(publication.imageFile)
	}

	let libro = null
	if (idLibro !== null) {
		const { data: libroData, error: errL } = await supabase
			.from('libros')
			.select('nombre')
			.eq('id', idLibro)
			.maybeSingle()
		if (errL && errL.code !== 'PGRST116') throw errL // Ignorar error de no encontrado
		libro = libroData
	}

	if (!libro || !libro.nombre || libro.nombre !== publication.libro?.nombre) {
		const { data: newLibro, error: errN } = await supabase
			.from('libros')
			.insert({
				nombre: publication.libro?.nombre || 'Libro sin nombre',
				materia: publication.libro?.materia || null,
				ano: publication.libro?.ano || null,
				editorial: publication.libro?.editorial || null
			})
			.select()
			.maybeSingle()
		if (errN) throw errN
		idLibro = newLibro.id
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

export async function updatePublicationFull(idPublicacion, libroFields, precio, estadoLibro, descripcion, imagen, imageFile = null) {
	const { data: pub } = await supabase
		.from('publicaciones')
		.select('id_libro, imagen')
		.eq('id', idPublicacion)
		.maybeSingle()
	if (!pub) throw new Error('Publicación no encontrada')

	const idLibro = pub.id_libro
	let imagenUrl = imagen !== undefined && imagen !== null && imagen !== '' ? imagen : pub.imagen || null
	if (imageFile) {
		imagenUrl = await uploadPublicationImage(imageFile)
	}
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
		.update({ precio, estado_libro: estadoLibro, descripcion, imagen: imagenUrl })
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
