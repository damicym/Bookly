-- Migración: agregar soporte de edición y eliminación a mensajes
-- Ejecutar en el SQL Editor de Supabase.
--
-- Estrategia: soft delete + flag de edición.
-- Los mensajes eliminados NO se borran físicamente; se marcan con eliminado = TRUE.
-- Esto preserva la integridad del historial y evita problemas de referencias.
--
-- Columnas nuevas:
--   editado       → TRUE si el contenido fue modificado al menos una vez
--   fecha_edicion → timestamp de la última edición (NULL si nunca fue editado)
--   eliminado     → TRUE si el usuario "borró" el mensaje (soft delete)

ALTER TABLE public.mensajes
  ADD COLUMN IF NOT EXISTS editado        BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fecha_edicion  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS eliminado      BOOLEAN      NOT NULL DEFAULT FALSE;

-- Índice para filtrar mensajes eliminados eficientemente
-- (la query getMensajes deberá agregar .eq('eliminado', false) o manejarlo en el cliente)
CREATE INDEX IF NOT EXISTS idx_mensajes_no_eliminados
  ON public.mensajes (id_emisor, id_receptor, eliminado, fecha_envio DESC);

-- Índice adicional para buscar un mensaje por id con validación de propiedad
-- (usado en UPDATE/DELETE con WHERE id = ? AND id_emisor = ?)
CREATE INDEX IF NOT EXISTS idx_mensajes_id_emisor
  ON public.mensajes (id, id_emisor);
