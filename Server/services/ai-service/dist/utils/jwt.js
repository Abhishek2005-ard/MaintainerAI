import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export const signSystemToken = () => {
    return jwt.sign({ id: 'system-agent', role: 'admin' }, env.JWT_SECRET, { expiresIn: '15m' });
};
