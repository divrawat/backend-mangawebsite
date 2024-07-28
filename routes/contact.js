import express from "express";
const router = express.Router();
import { contact, getcontacts, DeleteContact } from "../controllers/contact.js";
import { runvalidation } from "../validators/index.js"
import { check } from "express-validator";
import { requireSignin, adminMiddleware } from "../controllers/auth.js";

const usersigninvalidator = [check('email').isEmail().withMessage('Must be a valid email address')]

router.post('/contact', usersigninvalidator, runvalidation, contact);

router.get('/get-contacts', requireSignin, adminMiddleware, getcontacts);
router.delete('/contact/delete/:id', requireSignin, adminMiddleware, DeleteContact);

export default router