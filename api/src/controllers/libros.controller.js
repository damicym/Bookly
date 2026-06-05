import * as librosService from '../services/libros.service.js'

export async function getAllBooks(req, res) {
  try {
    const books = await librosService.getBooks()
    res.json(books)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getBook(req, res) {
  try {
    const { id } = req.params
    const book = await librosService.getBookById(parseInt(id))
    if (!book) {
      return res.status(404).json({ error: 'Libro no encontrado' })
    }
    res.json(book)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function searchBooks(req, res) {
  try {
    const { ano, materia, nombre } = req.query
    
    if (nombre) {
      const books = await librosService.searchBookNames(nombre)
      return res.json(books)
    }
    
    if (ano || materia) {
      const books = await librosService.filterBooks(
        ano ? parseInt(ano) : null,
        materia
      )
      return res.json(books)
    }
    
    res.status(400).json({ error: 'Especifica ano, materia o nombre' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function autocompleteBooks(req, res) {
  try {
    const { q } = req.query
    const books = await librosService.searchBookNames(q)
    res.json(books)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function deleteBook(req, res) {
  try {
    const { id } = req.params
    await librosService.deleteBook(parseInt(id))
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getUserBooks(req, res) {
  try {
    const { dni } = req.params
    const books = await librosService.getBooksByUser(dni)
    res.json(books)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
