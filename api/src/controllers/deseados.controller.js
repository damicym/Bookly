import * as deseadosService from '../services/deseados.service.js'

export async function addToWishlist(req, res) {
  try {
    const { dni, id_publicacion } = req.body
    if (!dni || !id_publicacion) {
      return res.status(400).json({ error: 'dni e id_publicacion son requeridos' })
    }
    await deseadosService.addToWishlist(dni, id_publicacion)
    res.json({ success: true, message: 'Agregado a deseados' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function removeFromWishlist(req, res) {
  try {
    const { dni, id_publicacion } = req.body
    if (!dni || !id_publicacion) {
      return res.status(400).json({ error: 'dni e id_publicacion son requeridos' })
    }
    await deseadosService.removeFromWishlist(dni, id_publicacion)
    res.json({ success: true, message: 'Removido de deseados' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getWishlist(req, res) {
  try {
    const { dni } = req.params
    const ids = await deseadosService.getWishlistIds(dni)
    res.json({ wishlist_ids: ids })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getFavorites(req, res) {
  try {
    const { dni } = req.params
    const pubs = await deseadosService.getFavoritePublications(dni)
    res.json(pubs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
