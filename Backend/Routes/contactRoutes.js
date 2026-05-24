import express from 'express';
import { submitContactForm } from '../Controllers/contactController.js';

const router = express.Router();

router.post('/', submitContactForm);

export default router;
