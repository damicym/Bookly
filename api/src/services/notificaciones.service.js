import supabase from '../db/supabase.js'

/**
 * Inserta una nueva notificación para un usuario.
 * @param {object} notif
 * @param {string} notif.id_usuario  - DNI del destinatario
 * @param {string} notif.tipo        - 'resena' | 'mensaje' | 'sistema' | ...
 * @param {string} notif.titulo
 * @param {string} [notif.subtitulo]
 * @param {string} [notif.vinculo]   - URL relativa
 * @param {object} [notif.payload]   - datos extra en JSON
 */
export async function createNotificacion({ id_usuario, tipo, titulo, subtitulo, vinculo, payload }) {
  const { error } = await supabase
    .from('notificaciones')
    .insert({
      id_usuario,
      tipo,
      titulo,
      subtitulo: subtitulo ?? null,
      vinculo:   vinculo   ?? null,
      payload:   payload   ?? null,
    })

  if (error) throw error
}

/**
 * Devuelve las notificaciones no leídas de un usuario, ordenadas por fecha desc.
 * @param {string} dni
 * @returns {Promise<Array>}
 */
export async function getNotificacionesPendientes(dni) {
  const { data, error } = await supabase
    .from('notificaciones')
    .select('id, tipo, titulo, subtitulo, vinculo, payload, created_at')
    .eq('id_usuario', dni)
    .eq('leida', false)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * Marca una notificación como leída (solo si pertenece al usuario indicado).
 * @param {number} id
 * @param {string} dni
 */
export async function marcarLeida(id, dni) {
  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('id', id)
    .eq('id_usuario', dni)

  if (error) throw error
}

/**
 * Marca todas las notificaciones pendientes de un usuario como leídas.
 * @param {string} dni
 */
export async function marcarTodasLeidas(dni) {
  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('id_usuario', dni)
    .eq('leida', false)

  if (error) throw error
}
