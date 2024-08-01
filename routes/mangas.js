import express from "express";
const router = express.Router();
import { requireSignin, adminMiddleware } from "../controllers/auth.js";
import { HomePageMangas, GetMangasDashBoard, MangasForSitemap, getSingleManga, addManga, DeleteManga, UpdateManga, getMangaChaptersRelated, getLatestMangas } from "../controllers/mangas.js";

router.get('/manga/get-latest-mangas', getLatestMangas);
router.get('/manga/home-page-mangas', HomePageMangas);
router.get('/manga/get-single-manga', getSingleManga);
router.get('/manga/get', requireSignin, adminMiddleware, GetMangasDashBoard);
router.get('/manga/get-manga-sitemap', MangasForSitemap);

router.get('/manga/get-manga-chapters-related', getMangaChaptersRelated);

router.post('/manga/add-manga', requireSignin, adminMiddleware, addManga);

router.delete('/manga/delete/:id', requireSignin, adminMiddleware, DeleteManga);
router.post('/manga/update/:id', requireSignin, adminMiddleware, UpdateManga);


export default router