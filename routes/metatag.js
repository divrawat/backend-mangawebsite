import express from "express";
const router = express.Router();
import { AddTag, getMetaTags, DeleteMetaTag, updateTag } from "../controllers/metatags.js";
import { requireSignin, adminMiddleware } from "../controllers/auth.js";

router.post('/add-tag', requireSignin, adminMiddleware, AddTag);
router.get('/get-metatags', getMetaTags);

router.post('/tag/update/:id', updateTag);

router.delete('/tag/delete/:id', DeleteMetaTag);

export default router