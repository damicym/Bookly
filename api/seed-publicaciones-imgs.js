/**
 * seed-publicaciones-imgs.js
 * Busca portadas para las publicaciones insertadas por seed-publicaciones.js
 * que quedaron sin imagen (ids 92-106), y las actualiza en Supabase.
 *
 * Usa el módulo https nativo de Node con rejectUnauthorized:false
 * para evitar el problema de certificado de la red local.
 *
 * Uso: node seed-publicaciones-imgs.js
 */

import { config } from './config.js'
import { createClient } from '@supabase/supabase-js'
import https from 'https'

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SECRET)

// Agente HTTPS que ignora SSL (mismo entorno que el resto del proyecto)
const agent = new https.Agent({ rejectUnauthorized: false })

/** GET JSON con timeout de 8s */
function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { agent }, res => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(body)) } catch (e) { reject(e) }
      })
    })
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')) })
    req.on('error', reject)
  })
}

/**
 * Busca una URL de portada para el título dado.
 * 1º Google Books API
 * 2º Open Library Search API
 */
async function fetchCover(titulo) {
  // 1. Google Books
  try {
    const q = encodeURIComponent(titulo)
    const json = await getJson(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=3`)
    for (const item of (json.items || [])) {
      const img = item.volumeInfo?.imageLinks
      const base = img?.extraLarge || img?.large || img?.medium || img?.small || img?.thumbnail
      if (base) return base.replace('http://', 'https://').replace('&edge=curl', '')
    }
  } catch (_) { /* timeout o error */ }

  // 2. Open Library
  try {
    const q = encodeURIComponent(titulo)
    const json = await getJson(`https://openlibrary.org/search.json?q=${q}&fields=cover_i&limit=3`)
    for (const doc of (json.docs || [])) {
      if (doc.cover_i) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
    }
  } catch (_) { /* timeout */ }

  return null
}

// ─────────────────────────────────────────────
// Búsquedas para los libros sin imagen
// (los que tienen imagen ya la tienen en IMAGEN del script anterior)
// ─────────────────────────────────────────────
const BUSQUEDAS = [
  // { id_pub, id_libro, query }
  { id_pub: 93,  id_libro: 13, query: 'Historia escuela secundaria Argentina Kapelusz' },
  { id_pub: 96,  id_libro: 16, query: 'Fuentes del Judaismo ORT libro' },
  { id_pub: 97,  id_libro: 14, query: 'Libro de Hebreo 1 ORT' },
  { id_pub: 98,  id_libro: 11, query: 'English Step by Step Oxford beginner' },
  { id_pub: 99,  id_libro: 9,  query: 'Introduccion a la programacion secundaria' },
  { id_pub: 100, id_libro: 7,  query: 'Biologia y Ambiente libro escolar' },
  { id_pub: 101, id_libro: 8,  query: 'Geography Global secondary school textbook' },
  { id_pub: 102, id_libro: 5,  query: 'Jewish history textbook secondary' },
  { id_pub: 103, id_libro: 1,  query: 'Ciencias Naturales 7 Kapelusz' },
  { id_pub: 104, id_libro: 10, query: 'Educacion Civica Hoy Longseller' },
  { id_pub: 105, id_libro: 2,  query: 'Jewish history Toldot book' },
  { id_pub: 106, id_libro: 3,  query: 'Toldot 2 ORT historia judia' },
]

async function main() {
  console.log('🔍 Buscando portadas para publicaciones sin imagen...\n')

  let actualizadas = 0

  for (const { id_pub, query } of BUSQUEDAS) {
    process.stdout.write(`  Pub #${id_pub} — "${query}" ... `)
    const url = await fetchCover(query)
    if (!url) {
      console.log('⚠️  no encontrada')
      continue
    }
    console.log(`✅`)

    const { error } = await supabase
      .from('publicaciones')
      .update({ imagen: url })
      .eq('id', id_pub)

    if (error) {
      console.error(`    ❌ Error actualizando pub #${id_pub}: ${error.message}`)
    } else {
      console.log(`    🖼️  ${url.slice(0, 90)}`)
      actualizadas++
    }
  }

  console.log(`\n🎉 ${actualizadas} publicaciones actualizadas con portada.`)
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
