import supabase from '../db/supabase.js'
import { fetchBooksByIds } from '../db/helpers.js'

export async function getBooks() {
	const { data, error } = await supabase
		.from('libros')
		.select('id, nombre, materia, ano, editorial')
	if (error) throw error
	return data || []
}

export async function getBookById(id) {
	const { data, error } = await supabase
		.from('libros')
		.select('id, nombre, materia, ano, editorial')
		.eq('id', id)
		.maybeSingle()
	if (error) throw error
	return data || null
}

export async function getBookByName(nombre) {
	if (!nombre) return null
	const { data, error } = await supabase
		.from('libros')
		.select('id, nombre, materia, ano, editorial')
		.ilike('nombre', nombre)
		.limit(1)
	if (error) throw error
	return data || null
}

export async function filterBooks(ano, materia) {
	let query = supabase.from('libros').select('id, nombre, materia, ano, editorial')
	if (ano) query = query.eq('ano', ano)
	if (materia) query = query.ilike('materia', materia)
	const { data, error } = await query
	if (error) throw error
	return data || []
}

export async function searchBookNames(text) {
	if (!text) return []
	const { data, error } = await supabase
		.from('libros')
		.select('nombre')
		.ilike('nombre', `%${text}%`)
		.order('nombre')
	if (error) throw error
	return (data || []).map(d => d.nombre)
}

export async function deleteBook(id) {
	const { error } = await supabase
		.from('libros')
		.delete()
		.eq('id', id)
	if (error) throw error
}

export async function getBooksByUser(dni) {
	const { data: pubs, error } = await supabase
		.from('publicaciones')
		.select('id_libro')
		.eq('id_vendedor', dni)
	if (error) throw error
	const ids = [...new Set((pubs || []).map(p => p.id_libro))].filter(Boolean)
	return await fetchBooksByIds(ids)
}
