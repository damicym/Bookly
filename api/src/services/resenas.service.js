import supabase from '../db/supabase.js'

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
    id:              r.id,
    id_redactor:     r.id_redactor,
    id_receptor:     r.id_receptor,
    nombre_receptor: usuariosMap.get(r.id_receptor) ?? null,
    fecha_respuesta: r.fecha_respuesta ?? null,
    entrega:         r.entrega ?? null,
    atencion:        r.atencion ?? null,
    created_at:      r.created_at ?? null,
  }))
}
