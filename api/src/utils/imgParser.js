import supabase from '../db/supabase.js'
import { randomUUID } from 'crypto'
import sharp from 'sharp'

export async function toOptimizedWebp(imageFile) {
	const MAX_IMAGE_WIDTH = 700
	const MAX_IMAGE_HEIGHT = 700
	const WEBP_QUALITY = 78

	if (!imageFile?.buffer || !imageFile.mimetype?.startsWith('image/')) {
		throw new Error('El archivo subido no es una imagen válida')
	}

	return sharp(imageFile.buffer, { failOn: 'none' })
		.rotate()
		.resize({
			width: MAX_IMAGE_WIDTH,
			height: MAX_IMAGE_HEIGHT,
			fit: 'inside',
			withoutEnlargement: true
		})
		.webp({ quality: WEBP_QUALITY })
		.toBuffer()
}

export async function uploadPublicationImage(imageFile, storagePath) {
	if (!imageFile) return null

	const filePath = `${randomUUID()}.webp`
	const webpBuffer = await toOptimizedWebp(imageFile)

	const { error } = await supabase.storage
		.from(storagePath)
		.upload(filePath, webpBuffer, {
			contentType: 'image/webp',
			upsert: false
		})

	if (error) throw error

	const { data } = supabase.storage
		.from(storagePath)
		.getPublicUrl(filePath)

	return data.publicUrl
}