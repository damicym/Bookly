import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = dotenv.parse(readFileSync(join(__dirname, '.env')))

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET.trim())

const { data, error } = await supabase
  .from('notificaciones')
  .insert({
    id_usuario: '45000111',
    tipo:       'acuerdo_aceptado',
    titulo:     '¡Tu compra fue aceptada!',
    subtitulo:  'Retirás "No es un rio" el 02/11/2026 a las 17:55 en: a',
    vinculo:    '/Chat?vendedorDNI=45000222',
    leida:      false,
    payload: {
      nombre_libro:   'No es un rio',
      precio:         7000,
      fecha:          '02/11/2026',
      hora:           '17:55',
      lugar:          'a',
      id_vendedor:    '45000222',
    },
  })
  .select()

if (error) {
  console.error('ERROR:', error.message)
  process.exit(1)
}

console.log('Notificación insertada:', JSON.stringify(data, null, 2))
process.exit(0)
