import { Router, Request, Response, RequestHandler } from 'express';
import passport from 'passport';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import config from '../config/env';
import * as AuthController from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 */
router.post('/register', AuthController.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 */
router.post('/login', AuthController.login);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authMiddleware as RequestHandler, AuthController.getMe);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: `${config.frontendUrl}/login?error=oauth_failed` }), (req: Request, res: Response) => {
    const user = req.user as any;

    // Generate JWT token
    const token = jwt.sign(
        { id: user.id, email: user.email },
        config.jwt.secret as Secret,
        { expiresIn: config.jwt.expiresIn as any }
    );

    // Redirect to frontend with token
    res.redirect(`${config.frontendUrl}/auth/callback?token=${token}`);
});

export default router;
