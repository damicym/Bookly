import * as publicacionesService from '../services/publicaciones.service.js'

function parseLibroField(libro) {
  if (!libro) return null
  if (typeof libro === 'object') return libro
  if (typeof libro === 'string') {
    try {
      return JSON.parse(libro)
    } catch {
      return null
    }
  }
  return null
}

export async function createPublication(req, res) {
  try {
    const { id_vendedor } = req.params
    const { libro, precio, estado_libro, descripcion } = req.body
    const libroParsed = parseLibroField(libro)
    const imagenBody = typeof req.body.imagen === 'string' ? req.body.imagen : null
    const imageFile = req.file || null
    
    if (!precio || !libroParsed) {
      return res.status(400).json({ error: 'Datos incompletos' })
    }
    
    const pub = await publicacionesService.createPublication(
      { libro: libroParsed, precio, estado_libro, descripcion, imagen: imagenBody, imageFile },
      id_vendedor
    )
    res.status(201).json(pub)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function updatePublication(req, res) {
  try {
    const { id } = req.params
    const { libro, precio, estado_libro, descripcion } = req.body
    const libroParsed = parseLibroField(libro)
    const imagenBody = typeof req.body.imagen === 'string' ? req.body.imagen : null
    const imageFile = req.file || null
    
    await publicacionesService.updatePublicationFull(
      parseInt(id),
      libroParsed,
      precio,
      estado_libro,
      descripcion,
      imagenBody,
      imageFile
    )
    res.json({ success: true, message: 'Publicación actualizada' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function deletePublication(req, res) {
  try {
    const { id } = req.params
    await publicacionesService.deletePublication(parseInt(id))
    res.json({ success: true, message: 'Publicación eliminada' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getPublication(req, res) {
  try {
    const { id } = req.params
    const pub = await publicacionesService.getPublicationById(parseInt(id))
    if (!pub) {
      return res.status(404).json({ error: 'Publicación no encontrada' })
    }
    res.json(pub)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getUserPublications(req, res) {
  try {
    const { dni } = req.params
    const pubs = await publicacionesService.getPublicationsOfUser(dni)
    res.json(pubs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getFeed(req, res) {
  try {
    const { limit } = req.query
    const pubs = await publicacionesService.getFeed(limit ? parseInt(limit) : -1)
    res.json(pubs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getRecommendations(req, res) {
  try {
    const { ano, especialidad } = req.query
    if (!ano) {
      return res.status(400).json({ error: 'año es requerido' })
    }
    const pubs = await publicacionesService.getRecommendations(parseInt(ano), especialidad)
    res.json(pubs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
