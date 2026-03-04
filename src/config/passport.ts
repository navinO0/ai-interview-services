import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import AuthService from '../services/AuthService';
import config from './env';
import db from './db';
import bcrypt from 'bcryptjs';

passport.use(new GoogleStrategy({
    clientID: config.googleClientID || 'placeholder_client_id',
    clientSecret: config.googleClientSecret || 'placeholder_client_secret',
    callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (!email) {
            return done(new Error('Google account has no email associated'));
        }

        const name = profile.displayName;

        // Check if user exists
        let user = await db('users').where({ email }).first();

        if (!user) {
            // Create user
            const dummyHash = await bcrypt.hash(profile.id + Date.now().toString(), 10);
            const [newUser] = await db('users').insert({
                email,
                password_hash: dummyHash,
                name
            }).returning('*');
            user = newUser;
        }

        return done(null, user);
    } catch (error) {
        return done(error as Error);
    }
}));

export default passport;
