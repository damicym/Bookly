import * as resenasService from '../services/resenas.service.js'

/**
 * POST /api/resenas
 * Inserta una nueva reseña con id_redactor, id_receptor y puntuaciones.
 */
export async function createResena(req, res) {
  try {
    const { id_redactor, id_receptor, atencion, entrega, responsable, proceso, comentario, problema } = req.body

    if (!id_redactor || !id_receptor) {
      return res.status(400).json({ error: 'id_redactor e id_receptor son requeridos' })
    }
    if (!Number.isInteger(atencion)    || atencion    < 1 || atencion    > 5 ||
        !Number.isInteger(entrega)     || entrega     < 1 || entrega     > 5 ||
        !Number.isInteger(responsable) || responsable < 1 || responsable > 5 ||
        !Number.isInteger(proceso)     || proceso     < 1 || proceso     > 5) {
      return res.status(400).json({ error: 'Las puntuaciones deben ser enteros entre 1 y 5' })
    }

    await resenasService.createResena({ id_redactor, id_receptor, atencion, entrega, responsable, proceso, comentario, problema })
    res.json({ success: true })
  } catch (err) {
    console.error('[createResena]', err.message)
    res.status(500).json({ error: err.message })
  }
}

/**
 * PATCH /api/resenas/:id
 * Recibe { atencion, entrega, comentario?, problema? } y completa la reseña pendiente.
 */
export async function updateResena(req, res) {
  try {
    const id = parseInt(req.params.id, 10)
    if (!id || id <= 0) return res.status(400).json({ error: 'ID inválido' })

    const { atencion, entrega, comentario, problema } = req.body

    // Validar que los promedios sean números entre 1 y 5
    if (!Number.isInteger(atencion) || atencion < 1 || atencion > 5 ||
        !Number.isInteger(entrega)  || entrega  < 1 || entrega  > 5) {
      return res.status(400).json({ error: 'atencion y entrega deben ser enteros entre 1 y 5' })
    }

    const updated = await resenasService.updateResena(id, { atencion, entrega, comentario, problema })
    if (!updated) return res.status(404).json({ error: 'Reseña no encontrada o ya completada' })

    res.json({ success: true })
  } catch (err) {
    console.error('[updateResena]', err.message)
    res.status(500).json({ error: err.message })
  }
}

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
