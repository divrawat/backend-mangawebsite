import express from "express";
const router = express.Router();
import { SearchMangas } from "../controllers/search.js";

router.get('/search-mangas', SearchMangas);

export default router