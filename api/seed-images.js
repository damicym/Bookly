/**
 * seed-images.js
 * Sube las imágenes de libros a Supabase Storage y actualiza
 * el campo `imagen` de las publicaciones en la BD.
 *
 * Uso: node seed-images.js
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '.env') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET
)

// Mapeo nombre del libro → archivo de imagen
const IMAGENES = {
  'Ciencias Naturales 7':                         'cienciasnaturales.jpg',
  'Toldot 1':                                     'toldot1.jpg',
  'Toldot 2':                                     'toldot2.jpg',
  'Toldot 3':                                     'toldot3.jpg',
  'Toldot 4':                                     'toldot4.jpg',
  'C1 Students Book':                             'c1studentsbook.jpg',
  'Biologia y Ambiente':                          'biologiayambiente.png',
  'Geografia Global':                             'geografiaglobal.jpg',
  'Introduccion a la Programacion':               'introduccionprogramacion.jpg',
  'Educacion Civica Hoy':                         'educacioncivica.jpg',
  'Ingles Step by Step':                          'inglesstepbystep.jpg',
  'El Eternauta':                                 'eleternauta.jpg',
  'Historia':                                     'historia.jpg',
  'Libro de Hebreo 1':                            'hebreo1.jpg',
  'El extraño caso del Dr. Jekyll y el Sr. Hyde': 'jekyllandhyde.jpg',
  'Fuentes del Judaismo 3':                       'fuentesjudaismo.jpg',
}

// AJUSTA ESTA RUTA SEGÚN DÓNDE ESTÉN TUS IMÁGENES LOCALES ⬇️
const IMG_DIR = path.resolve(__dirname, '../web/wwwroot/img/libros')
const BUCKET = 'images'

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some(b => b.name === BUCKET)
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (error) throw new Error(`No se pudo crear el bucket: ${error.message}`)
    console.log(`✅ Bucket '${BUCKET}' creado`)
  } else {
    console.log(`ℹ️  Bucket '${BUCKET}' ya existe`)
  }
}

async function uploadImage(filename) {
  const filepath = path.join(IMG_DIR, filename)
  if (!fs.existsSync(filepath)) {
    console.warn(`⚠️  No encontrado: ${filename}`)
    return null
  }
  const bytes = fs.readFileSync(filepath)
  // Convertir a webp — el bucket solo acepta image/webp
  const webpBytes = await sharp(bytes).webp({ quality: 85 }).toBuffer()
  const storagePath = `libros/${path.basename(filename, path.extname(filename))}.webp`

  // Subir (upsert para no fallar si ya existe)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, webpBytes, { contentType: 'image/webp', upsert: true })

  if (error) {
    console.error(`❌ Error subiendo ${filename}: ${error.message}`)
    return null
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

async function main() {
  console.log('🚀 Iniciando seed de imágenes...\n')

  await ensureBucket()

  // Obtener todos los libros
  const { data: libros, error: errLibros } = await supabase
    .from('libros')
    .select('id, nombre')

  if (errLibros) throw errLibros
  console.log(`📚 ${libros.length} libros encontrados\n`)

  for (const libro of libros) {
    const archivo = IMAGENES[libro.nombre]
    if (!archivo) {
      console.log(`⏭️  Sin imagen mapeada para: ${libro.nombre}`)
      continue
    }

    console.log(`📤 Subiendo imagen para "${libro.nombre}" → ${archivo}`)
    const url = await uploadImage(archivo)
    if (!url) continue

    // Actualizar todas las publicaciones de ese libro
    const { error: errUpdate } = await supabase
      .from('publicaciones')
      .update({ imagen: url })
      .eq('id_libro', libro.id)

    if (errUpdate) {
      console.error(`❌ Error actualizando publicaciones de "${libro.nombre}": ${errUpdate.message}`)
    } else {
      console.log(`✅ Actualizado: ${url}`)
    }
  }

  console.log('\n🎉 Seed de imágenes completado.')
}

main().catch(err => {
  console.error('Error fatal:', err.message)
  process.exit(1)
})
