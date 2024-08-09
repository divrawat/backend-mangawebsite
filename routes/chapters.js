import express from "express";
const router = express.Router();
import { requireSignin, adminMiddleware } from "../controllers/auth.js";
import { GetMangaChaptersDashBoard, UploadSingleChapter, GetMostRecentChapters, ChapterWith0Images, ChapterForSitemap, getParticularMangaChapterWithRelated, BulkPostChapters, BulkDeleteChapters, DeleteChapter, UpdateChapter } from "../controllers/chapters.js";

router.get('/chapters/get', requireSignin, adminMiddleware, GetMangaChaptersDashBoard);
router.get('/chapters/get-particular-manga-chapter-with-related', getParticularMangaChapterWithRelated);
router.get('/chapters/get-most-recent-chapters', GetMostRecentChapters);
router.get('/chapters/get-chapter-sitemap', ChapterForSitemap);
router.get('/chapters/get-chapter-with-0-images', ChapterWith0Images);

router.post('/chapters/single-post', requireSignin, adminMiddleware, UploadSingleChapter);
router.post('/chapters/bulk-post', requireSignin, adminMiddleware, BulkPostChapters);
router.post('/chapters/update/:id', requireSignin, adminMiddleware, UpdateChapter);


router.delete('/chapters/bulk-delete', requireSignin, adminMiddleware, BulkDeleteChapters);
router.delete('/chapters/delete/:id', requireSignin, adminMiddleware, DeleteChapter);



export default router