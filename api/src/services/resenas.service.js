import supabase from '../db/supabase.js'

/**
 * Inserta una nueva reseña en la tabla resenas.
 */
export async function createResena({ id_redactor, id_receptor, atencion, entrega, responsable, proceso, comentario, problema }) {
  const { error } = await supabase
    .from('resenas')
    .insert({
      id_redactor,
      id_receptor,
      atencion,
      entrega,
      responsable:     responsable || null,
      proceso:         proceso     || null,
      comentario:      comentario  || null,
      problema:        problema    || null,
      fecha_respuesta: new Date().toISOString(),
    })

  if (error) throw error
}

/**
 * Devuelve todas las reseñas completadas donde id_receptor = dni.
 * Solo incluye filas con atencion y entrega no nulos.
 */
export async function getResenasByReceptor(dni) {
  const { data: resenas, error } = await supabase
    .from('resenas')
    .select('ov, id_redactor, id_receptor, atencion, entrega, fecha_respuesta, created_at')
    .eq('id_receptor', dni)
    .not('atencion', 'is', null)
    .not('entrega', 'is', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (resenas ?? []).map(r => ({ ...r, id: r.ov }))
}

/**
 * PATCH /api/resenas/:id
 * Completa una reseña pendiente con los promedios calculados y textos opcionales.
 * Marca fecha_respuesta con el momento actual.
 */
export async function updateResena(id, { atencion, entrega, comentario, problema }) {
  const { data, error } = await supabase
    .from('resenas')
    .update({
      atencion,
      entrega,
      comentario:       comentario  ?? null,
      problema:         problema    ?? null,
      fecha_respuesta:  new Date().toISOString(),
    })
    .eq('ov', id)
    .is('fecha_respuesta', null)   // solo permite actualizar reseñas aún pendientes
    .select('ov')
    .single()

  if (error) throw error
  return data
}

/**
 * Devuelve todas las reseñas donde id_redactor = dni.
 * Enriquece cada fila con nombre_comp del receptor (join manual).
 */
export async function getResenasByRedactor(dni) {
  const { data: resenas, error } = await supabase
    .from('resenas')
    .select('*')
    .eq('id_redactor', dni)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!resenas || resenas.length === 0) return []

  // Obtener los DNIs únicos de los receptores para enriquecer con nombre
  const dnis = [...new Set(resenas.map(r => r.id_receptor).filter(Boolean))]

  const { data: usuarios, error: errU } = await supabase
    .from('usuarios')
    .select('dni, nombre_comp')
    .in('dni', dnis)

  if (errU) throw errU

  const usuariosMap = new Map((usuarios || []).map(u => [u.dni, u.nombre_comp]))

  return resenas.map(r => ({
    id:              r.ov,
    id_redactor:     r.id_redactor,
    id_receptor:     r.id_receptor,
    nombre_receptor: usuariosMap.get(r.id_receptor) ?? null,
    fecha_respuesta: r.fecha_respuesta ?? null,
    entrega:         r.entrega ?? null,
    atencion:        r.atencion ?? null,
    created_at:      r.created_at ?? null,
  }))
}
