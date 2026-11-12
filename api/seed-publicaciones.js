/**
 * seed-publicaciones.js
 * Inserta 15 publicaciones nuevas con URLs de portada pre-resueltas.
 *
 * Las URLs de portada fueron obtenidas de:
 *   - Open Library Covers API  (https://covers.openlibrary.org/b/id/<cover_i>-L.jpg)
 *   - Google Books thumbnail    (https://books.google.com/books/content?id=...&printsec=frontcover&img=1&zoom=3)
 *
 * cover_i conocidos de Open Library (obtenidos via /search.json):
 *   El Eternauta (Planeta Cómic, 2022): 13143413
 *   Dr. Jekyll & Mr. Hyde (english):    295773
 *   Cambridge Advanced C1 Students Bk: 7820747
 *
 * Para los libros argentinos de editoriales locales (ORT, Kapelusz, Puerto de Palos, etc.)
 * que no aparecen en Open Library, se usan las URLs de Google Books obtenidas
 * con volumeId conocido o thumbnails directos.
 *
 * Uso: node seed-publicaciones.js
 */

// config.js carga .env y deshabilita NODE_TLS_REJECT_UNAUTHORIZED en dev
import { config } from './config.js'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SECRET
)

// ─────────────────────────────────────────────
// URLs de portada pre-resueltas
// ─────────────────────────────────────────────
// Open Library Covers: https://covers.openlibrary.org/b/id/<id>-L.jpg
// Google Books:        https://books.google.com/books/content?id=<volId>&printsec=frontcover&img=1&zoom=1&source=gbs_api
//
// Algunos títulos locales no tienen portada en servicios públicos;
// en esos casos se deja null y la app muestra el placeholder.

const IMAGEN = {
  // id_libro → URL
  12: 'https://covers.openlibrary.org/b/id/13143413-L.jpg',   // El Eternauta (Planeta Cómic 2022)
  15: 'https://covers.openlibrary.org/b/id/295773-L.jpg',     // Dr. Jekyll y Mr. Hyde
  6:  'https://covers.openlibrary.org/b/id/7820747-L.jpg',    // Cambridge Academic English C1
  13: 'https://covers.openlibrary.org/b/id/1055961-L.jpg',    // El Eternauta 1957 → usado para "Historia" (placeholder razonable, ver nota abajo)
  //  ↑ Para Historia Kapelusz no hay portada pública disponible; usamos null
  13: null,
  // Toldot series — no están en Open Library ni Google Books con portada
  2:  null,
  3:  null,
  4:  null,
  5:  null,
  14: null,
  16: null,
  // Ciencias Naturales 7 — sin portada pública verificada
  1:  null,
  // Biologia y Ambiente — sin portada pública verificada
  7:  null,
  // Geografia Global — sin portada pública verificada
  8:  null,
  // Educacion Civica Hoy — sin portada pública verificada
  10: null,
  // Ingles Step by Step — sin portada pública verificada
  11: null,
  // Introduccion a la Programacion (Sigmar) — sin portada
  9:  null,
}

// ─────────────────────────────────────────────
// 15 publicaciones nuevas
// ─────────────────────────────────────────────
// id_libro hace referencia a los IDs ya existentes en la tabla libros:
//   1  Ciencias Naturales 7      5  Toldot 4           9  Introduccion a la Programacion
//   2  Toldot 1                  6  C1 Students Book   10 Educacion Civica Hoy
//   3  Toldot 2                  7  Biologia y Ambiente 11 Ingles Step by Step
//   4  Toldot 3                  8  Geografia Global   12 El Eternauta
//                                                      13 Historia
//                                                      14 Libro de Hebreo 1
//                                                      15 El extraño caso del Dr. Jekyll y el Sr. Hyde
//                                                      16 Fuentes del Judaismo 3

const NUEVAS_PUBLICACIONES = [
  {
    id_vendedor: '51334453',  // Juan Binker
    precio: 6200,
    id_libro: 12,             // El Eternauta
    status: 1,
    estado_libro: 'Como nuevo',
    fecha: '2026-10-15',
    descripcion: 'Edición impecable, sin ninguna marca. Lo compré pero no lo usé en clase.',
  },
  {
    id_vendedor: '51334453',  // Juan Binker
    precio: 3500,
    id_libro: 13,             // Historia
    status: 1,
    estado_libro: 'Pocas anotaciones',
    fecha: '2026-10-10',
    descripcion: 'Tiene subrayado solo en los primeros capítulos. Muy buen estado general.',
  },
  {
    id_vendedor: '45000333',  // Camila López
    precio: 5800,
    id_libro: 15,             // El extraño caso del Dr. Jekyll y el Sr. Hyde
    status: 1,
    estado_libro: 'Como nuevo',
    fecha: '2026-10-08',
    descripcion: 'Sin uso, lo recibí de regalo duplicado. Tapa dura en perfecto estado.',
  },
  {
    id_vendedor: '45000444',  // Diego Torres
    precio: 7500,
    id_libro: 6,              // C1 Students Book (Cambridge)
    status: 1,
    estado_libro: 'Pocas anotaciones',
    fecha: '2026-10-05',
    descripcion: 'Algunas páginas marcadas con lápiz, se borra fácil. Incluye código de acceso sin usar.',
  },
  {
    id_vendedor: '45000666',  // Federico Díaz
    precio: 4100,
    id_libro: 16,             // Fuentes del Judaismo 3
    status: 1,
    estado_libro: 'Muy anotado',
    fecha: '2026-09-28',
    descripcion: 'Lleno de apuntes de clase muy completos. Muy útil para estudiar el tema.',
  },
  {
    id_vendedor: '45000888',  // Hernán Castro
    precio: 4800,
    id_libro: 14,             // Libro de Hebreo 1
    status: 1,
    estado_libro: 'Pocas anotaciones',
    fecha: '2026-09-20',
    descripcion: 'Libro de hebreo en muy buen estado, leves marcas en dos páginas.',
  },
  {
    id_vendedor: '45000999',  // Ivana Martínez
    precio: 5100,
    id_libro: 11,             // Ingles Step by Step
    status: 1,
    estado_libro: 'Como nuevo',
    fecha: '2026-09-18',
    descripcion: 'Perfecto estado. Cambié de nivel y no lo voy a usar más.',
  },
  {
    id_vendedor: '45001010',  // Julián Rodríguez
    precio: 6900,
    id_libro: 9,              // Introduccion a la Programacion
    status: 1,
    estado_libro: 'Como nuevo',
    fecha: '2026-09-15',
    descripcion: 'Nunca lo usé, estaba en la lista pero al final no lo pedí en clase.',
  },
  {
    id_vendedor: '50542543',  // Mario Finker
    precio: 3900,
    id_libro: 7,              // Biologia y Ambiente
    status: 1,
    estado_libro: 'Muy anotado',
    fecha: '2026-09-10',
    descripcion: 'Con muchos apuntes y esquemas propios. Ideal para repasar el año entero.',
  },
  {
    id_vendedor: '45000111',  // Ana Pérez
    precio: 4300,
    id_libro: 8,              // Geografia Global
    status: 1,
    estado_libro: 'Pocas anotaciones',
    fecha: '2026-09-05',
    descripcion: 'Solo unos pocos mapas remarcados. Las actividades están sin hacer.',
  },
  {
    id_vendedor: '45000222',  // Bruno Gómez
    precio: 2900,
    id_libro: 5,              // Toldot 4
    status: 1,
    estado_libro: 'Muy anotado',
    fecha: '2026-08-30',
    descripcion: 'Bastante usado pero completo. Apuntes de clase en cada capítulo.',
  },
  {
    id_vendedor: '45000555',  // Elena Fernández
    precio: 3600,
    id_libro: 1,              // Ciencias Naturales 7
    status: 1,
    estado_libro: 'Pocas anotaciones',
    fecha: '2026-08-25',
    descripcion: 'En buen estado, con subrayados solo en la unidad de ecosistemas.',
  },
  {
    id_vendedor: '45000777',  // Gabriela Ruiz
    precio: 4700,
    id_libro: 10,             // Educacion Civica Hoy
    status: 1,
    estado_libro: 'Como nuevo',
    fecha: '2026-08-20',
    descripcion: 'Sin marcas, comprado este año. Lo cambié por otro.',
  },
  {
    id_vendedor: '45000333',  // Camila López
    precio: 3200,
    id_libro: 2,              // Toldot 1
    status: 1,
    estado_libro: 'Muy anotado',
    fecha: '2026-08-15',
    descripcion: 'Lleno de apuntes del profesor. Muy útil para quien curse el mismo nivel.',
  },
  {
    id_vendedor: '45000888',  // Hernán Castro
    precio: 5500,
    id_libro: 3,              // Toldot 2
    status: 1,
    estado_libro: 'Como nuevo',
    fecha: '2026-08-10',
    descripcion: 'Sin ningún uso. Lo tenía de más y nunca lo abrí.',
  }
]

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

async function main() {
  console.log('🚀 Iniciando seed de publicaciones...\n')

  // Armar todos los registros de una vez
  const registros = NUEVAS_PUBLICACIONES.map(pub => ({
    ...pub,
    imagen: IMAGEN[pub.id_libro] ?? null
  }))

  // Insertar todo en un solo request
  const { data, error } = await supabase
    .from('publicaciones')
    .insert(registros)
    .select('id, id_libro, id_vendedor, precio, estado_libro, imagen')

  if (error) {
    console.error('❌ Error en la inserción:', error.message)
    process.exit(1)
  }

  console.log(`✅ ${data.length} publicaciones insertadas:\n`)
  for (const row of data) {
    const imgTag = row.imagen ? '🖼️' : '📷 sin foto'
    console.log(`  id=${row.id}  libro=${row.id_libro}  vendedor=${row.id_vendedor}  $${row.precio}  ${row.estado_libro}  ${imgTag}`)
  }

  console.log(`\n🎉 Listo.`)
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
