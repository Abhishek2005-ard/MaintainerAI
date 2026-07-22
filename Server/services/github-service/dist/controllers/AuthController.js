import { env } from '../config/env.js';
import { githubApiService } from '../services/GitHubApiService.js';
import { UserModel } from '../models/UserModel.js';
import { signToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
export class AuthController {
    // Redirect user to GitHub OAuth login page
    loginRedirect(req, res) {
        const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&scope=user:email,repo`;
        res.json({ url: redirectUrl });
    }
    // Handle GitHub OAuth callback
    async handleCallback(req, res, next) {
        try {
            const { code } = req.query;
            if (!code || typeof code !== 'string') {
                return res.status(400).json({ error: 'Code parameter is required.' });
            }
            logger.info('Exchanging OAuth code for token...');
            const accessToken = await githubApiService.getOAuthAccessToken(code);
            logger.info('Fetching user profile details from GitHub...');
            const profile = await githubApiService.getUserProfile(accessToken);
            // Save user or update credentials
            let user = await UserModel.findOne({ email: profile.email });
            if (!user) {
                user = new UserModel({
                    name: profile.name,
                    email: profile.email,
                    githubId: profile.id,
                    githubUsername: profile.login,
                    githubAccessToken: accessToken,
                    role: 'maintainer'
                });
            }
            else {
                user.githubId = profile.id;
                user.githubUsername = profile.login;
                user.githubAccessToken = accessToken;
            }
            await user.save();
            // Generate local JWT token
            const token = signToken({
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role
            });
            res.json({
                message: 'Successfully authenticated with GitHub',
                token,
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    githubUsername: user.githubUsername
                }
            });
        }
        catch (err) {
            next(err);
        }
    }
}
export const authController = new AuthController();
