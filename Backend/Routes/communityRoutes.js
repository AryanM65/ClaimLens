import express from 'express';
import { createPost, getPosts, toggleLikePost } from '../Controllers/communityController.js';
import { protect } from '../Middlewares/authMiddleware.js';

const router = express.Router();

// Public: GET list of opinions
router.get('/get-posts', getPosts);

// Private: POST a new opinion (requires login)
router.post('/create-post', protect, createPost);

// Private: Toggle upvoting/liking a post (requires login)
router.post('/:id/like', protect, toggleLikePost);

export default router;
