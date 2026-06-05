import * as publicacionesService from '../services/publicaciones.service.js'

export async function createPublication(req, res) {
  try {
    const { id_vendedor } = req.params
    const { libro, precio, estado_libro, descripcion, imagen } = req.body
    
    if (!precio || !libro) {
      return res.status(400).json({ error: 'Datos incompletos' })
    }
    
    const pub = await publicacionesService.createPublication(
      { libro, precio, estado_libro, descripcion, imagen },
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
    const { libro, precio, estado_libro, descripcion, imagen } = req.body
    
    await publicacionesService.updatePublicationFull(
      parseInt(id),
      libro,
      precio,
      estado_libro,
      descripcion,
      imagen
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
