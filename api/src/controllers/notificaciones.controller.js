import * as notifService from '../services/notificaciones.service.js'

/**
 * GET /api/notificaciones/:dni
 * Devuelve las notificaciones no leídas del usuario.
 */
export async function getPendientes(req, res) {
  try {
    const { dni } = req.params
    if (!dni) return res.status(400).json({ error: 'DNI requerido' })

    const notifs = await notifService.getNotificacionesPendientes(dni)
    res.json(notifs)
  } catch (err) {
    console.error('[getPendientes]', err.message)
    res.status(500).json({ error: err.message })
  }
}

/**
 * PATCH /api/notificaciones/:id/leer
 * Marca una notificación como leída.
 * Body: { dni }
 */
export async function marcarLeida(req, res) {
  try {
    const id  = parseInt(req.params.id, 10)
    const { dni } = req.body

    if (!id || !dni) return res.status(400).json({ error: 'id y dni requeridos' })

    await notifService.marcarLeida(id, dni)
    res.json({ success: true })
  } catch (err) {
    console.error('[marcarLeida]', err.message)
    res.status(500).json({ error: err.message })
  }
}

/**
 * PATCH /api/notificaciones/:dni/leer-todas
 * Marca todas las notificaciones pendientes del usuario como leídas.
 */
export async function marcarTodasLeidas(req, res) {
  try {
    const { dni } = req.params
    if (!dni) return res.status(400).json({ error: 'DNI requerido' })

    await notifService.marcarTodasLeidas(dni)
    res.json({ success: true })
  } catch (err) {
    console.error('[marcarTodasLeidas]', err.message)
    res.status(500).json({ error: err.message })
  }
}
