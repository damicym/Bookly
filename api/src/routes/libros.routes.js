import { Router } from 'express'
import * as librosCtrl from '../controllers/libros.controller.js'

const router = Router()

// GET /api/libros
router.get('/', librosCtrl.getAllBooks)

// GET /api/libros/search?ano=1&materia=x&nombre=x
router.get('/search', librosCtrl.searchBooks)

// GET /api/libros/autocomplete?q=texto
router.get('/autocomplete', librosCtrl.autocompleteBooks)

// GET /api/libros/:id
router.get('/:id', librosCtrl.getBook)

// GET /api/libros/usuario/:dni
router.get('/usuario/:dni', librosCtrl.getUserBooks)

// DELETE /api/libros/:id
router.delete('/:id', librosCtrl.deleteBook)

export default router
