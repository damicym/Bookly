import { Router } from 'express'
import multer from 'multer'
import * as publicacionesCtrl from '../controllers/publicaciones.controller.js'

const router = Router()
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 50 * 1024 * 1024 }
})

// GET /api/publicaciones/feed?limit=10
router.get('/feed', publicacionesCtrl.getFeed)

// GET /api/publicaciones/recomendaciones?ano=1&especialidad=x
router.get('/recomendaciones', publicacionesCtrl.getRecommendations)

// GET /api/publicaciones/:id
router.get('/:id', publicacionesCtrl.getPublication)

// GET /api/publicaciones/usuario/:dni
router.get('/usuario/:dni', publicacionesCtrl.getUserPublications)

// POST /api/publicaciones/:id_vendedor
router.post('/:id_vendedor', upload.single('imagen'), publicacionesCtrl.createPublication)

// PUT /api/publicaciones/:id
router.put('/:id', upload.single('imagen'), publicacionesCtrl.updatePublication)

// DELETE /api/publicaciones/:id
router.delete('/:id', publicacionesCtrl.deletePublication)

export default router
