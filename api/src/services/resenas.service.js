import supabase from '../db/supabase.js'
import { createNotificacion } from './notificaciones.service.js'

/**
 * Inserta una nueva reseña en la tabla resenas y crea la notificación
 * correspondiente para el redactor (comprador).
 */
export async function createResena({ id_redactor, id_receptor, atencion, entrega, responsable, proceso, comentario, problema, id_publicacion }) {
  const { error } = await supabase
    .from('resenas')
    .insert({
      id_redactor,
      id_receptor,
      atencion,
      entrega,
      responsable:     responsable    || null,
      proceso:         proceso        || null,
      comentario:      comentario     || null,
      problema:        problema       || null,
      id_publicacion:  id_publicacion || null,
      fecha_respuesta: new Date().toISOString(),
    })

  if (error) throw error

  // Obtener nombre del receptor para el texto de la notificación
  const { data: receptor } = await supabase
    .from('usuarios')
    .select('nombre_comp')
    .eq('dni', id_receptor)
    .maybeSingle()

  const nombreReceptor = receptor?.nombre_comp ?? 'el vendedor'

  // Obtener nombre del libro si hay publicación
  let nombreLibro = null
  if (id_publicacion) {
    const { data: pub } = await supabase
      .from('publicaciones')
      .select('id_libro')
      .eq('id', id_publicacion)
      .maybeSingle()
    if (pub?.id_libro) {
      const { data: libro } = await supabase
        .from('libros')
        .select('nombre')
        .eq('id', pub.id_libro)
        .maybeSingle()
      nombreLibro = libro?.nombre ?? null
    }
  }

  try {
    await createNotificacion({
      id_usuario: id_redactor,
      tipo:       'resena_pendiente',
      titulo:     `Calificá a ${nombreReceptor}`,
      subtitulo:  'Tocá para dejar tu reseña',
      vinculo:    null,   // se construye dinámicamente en el frontend con el payload
      payload:    {
        id_receptor,
        nombre_receptor:  nombreReceptor,
        id_publicacion:   id_publicacion ?? null,
        nombre_libro:     nombreLibro,
      },
    })
  } catch (notifErr) {
    console.error('[createResena] Error al crear notificación:', notifErr.message)
  }
}

/**
 * Devuelve todas las reseñas completadas donde id_receptor = dni.
 * Solo incluye filas con atencion y entrega no nulos.
 */
export async function getResenasByReceptor(dni) {
  const { data: resenas, error } = await supabase
    .from('resenas')
    .select('id, id_redactor, id_receptor, atencion, entrega, fecha_respuesta, created_at')
    .eq('id_receptor', dni)
    .not('atencion', 'is', null)
    .not('entrega', 'is', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (resenas ?? []).map(r => ({ ...r }))
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
    .eq('id', id)
    .is('fecha_respuesta', null)
    .select('id')
    .single()

  if (error) throw error
  return data
}

/**
 * Devuelve todas las reseñas donde id_redactor = dni.
 * Enriquece cada fila con nombre_comp del receptor (join manual) y nombre_libro de la publicación.
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

  // Obtener IDs de publicaciones para enriquecer con nombre del libro
  const pubIds = [...new Set(resenas.map(r => r.id_publicacion).filter(Boolean))]

  let pubMap = new Map()
  if (pubIds.length > 0) {
    const { data: pubs, error: errP } = await supabase
      .from('publicaciones')
      .select('id, id_libro')
      .in('id', pubIds)

    if (!errP && pubs && pubs.length > 0) {
      const libroIds = [...new Set(pubs.map(p => p.id_libro).filter(Boolean))]

      const { data: libros, error: errL } = await supabase
        .from('libros')
        .select('id, nombre')
        .in('id', libroIds)

      if (!errL && libros) {
        const librosMap = new Map(libros.map(l => [l.id, l.nombre]))
        for (const pub of pubs) {
          pubMap.set(pub.id, librosMap.get(pub.id_libro) ?? null)
        }
      }
    }
  }

  return resenas.map(r => ({
    id:              r.id,
    id_redactor:     r.id_redactor,
    id_receptor:     r.id_receptor,
    nombre_receptor: usuariosMap.get(r.id_receptor) ?? null,
    fecha_respuesta: r.fecha_respuesta ?? null,
    entrega:         r.entrega ?? null,
    atencion:        r.atencion ?? null,
    created_at:      r.created_at ?? null,
    id_publicacion:  r.id_publicacion ?? null,
    nombre_libro:    r.id_publicacion ? (pubMap.get(r.id_publicacion) ?? null) : null,
  }))
}
