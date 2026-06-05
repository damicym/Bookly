import { Router } from 'express'
import * as deseadosCtrl from '../controllers/deseados.controller.js'

const router = Router()

// POST /api/deseados/add
router.post('/add', deseadosCtrl.addToWishlist)

// POST /api/deseados/remove
router.post('/remove', deseadosCtrl.removeFromWishlist)

// GET /api/deseados/:dni/ids
router.get('/:dni/ids', deseadosCtrl.getWishlist)

// GET /api/deseados/:dni/favoritos
router.get('/:dni/favoritos', deseadosCtrl.getFavorites)

export default router
