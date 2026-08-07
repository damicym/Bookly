import * as resenasService from '../services/resenas.service.js'

/**
 * GET /api/resenas/receptor/:dni
 * Devuelve las reseñas completadas cuyo id_receptor coincide con :dni.
 */
export async function getResenasByReceptor(req, res) {
  try {
    const { dni } = req.params
    if (!dni) return res.status(400).json({ error: 'DNI requerido' })

    const resenas = await resenasService.getResenasByReceptor(dni)
    res.json(resenas)
  } catch (err) {
    console.error('[getResenasByReceptor]', err.message)
    res.status(500).json({ error: err.message })
  }
}

/**
 * GET /api/resenas/redactor/:dni
 * Devuelve todas las reseñas cuyo id_redactor coincide con :dni.
 */
export async function getResenasByRedactor(req, res) {
  try {
    const { dni } = req.params
    if (!dni) return res.status(400).json({ error: 'DNI requerido' })

    const resenas = await resenasService.getResenasByRedactor(dni)
    res.json(resenas)
  } catch (err) {
    console.error('[getResenasByRedactor]', err.message)
    res.status(500).json({ error: err.message })
  }
}
