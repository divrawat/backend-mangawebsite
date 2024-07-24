import express from "express";
const router = express.Router();
import { requireSignin, adminMiddleware } from "../controllers/auth.js";
import { CreateCategory, DeleteCategory, GetMangaCategories, GetCategories } from "../controllers/categories.js";

router.get('/admin-category/get', GetCategories);
router.post('/admin-category/create', requireSignin, adminMiddleware, CreateCategory);
router.get('/admin-category/getmangacategories', GetMangaCategories);
router.delete('/admin-category/delete/:slug', requireSignin, adminMiddleware, DeleteCategory);

export default router