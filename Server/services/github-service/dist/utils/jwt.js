import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export const signToken = (payload) => {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
};
export const verifyToken = (token) => {
    return jwt.verify(token, env.JWT_SECRET);
};
export const signSystemToken = () => {
    return jwt.sign({ id: 'github-service', role: 'admin' }, env.JWT_SECRET, { expiresIn: '15m' });
};
