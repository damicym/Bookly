import supabase from './supabase.js'

// Fetch books by IDs - shared helper
export async function fetchBooksByIds(ids = []) {
	if (!ids || ids.length === 0) return []
	const { data, error } = await supabase
		.from('libros')
		.select('id, nombre, materia, ano, editorial')
		.in('id', ids)
	if (error) throw error
	return data || []
}

// Map books by ID for quick lookup - shared helper
export async function mapBooksById(ids = []) {
	const books = await fetchBooksByIds(ids)
	const map = new Map()
	for (const b of books) map.set(b.id, b)
	return map
}
