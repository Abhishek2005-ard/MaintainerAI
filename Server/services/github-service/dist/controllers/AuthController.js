import { env } from '../config/env.js';
import * as githubApiService from '../services/GitHubApiService.js';
import * as installationService from '../services/InstallationService.js';
import { UserModel } from '../models/UserModel.js';
import { signToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/ApiError.js';
// Redirect user to GitHub OAuth login page
export const loginRedirect = (req, res) => {
    const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&scope=user:email,repo`;
    res.json({ url: redirectUrl });
};
// Handle GitHub OAuth callback
export const handleCallback = catchAsync(async (req, res, next) => {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
        throw new ApiError(400, 'Code parameter is required.');
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
});
// GET /auth/install - Return dynamic installation URL
export const getInstallUrl = catchAsync(async (req, res, next) => {
    const slug = await githubApiService.getAppSlug();
    const installUrl = `https://github.com/apps/${slug}/installations/new`;
    res.json({ url: installUrl });
});
// GET /auth/installation/callback - Handle setup redirect after App installation
export const handleInstallationCallback = catchAsync(async (req, res, next) => {
    const { installation_id, setup_action } = req.query;
    if (!installation_id || typeof installation_id !== 'string') {
        throw new ApiError(400, 'installation_id parameter is required.');
    }
    const installationIdNum = parseInt(installation_id, 10);
    if (isNaN(installationIdNum)) {
        throw new ApiError(400, 'Invalid installation_id parameter.');
    }
    logger.info(`Handling installation callback for installation ID: ${installationIdNum}, Action: ${setup_action}`);
    // Immediate sync of the installation and repositories details
    await installationService.syncInstallationAndRepos(installationIdNum);
    // Redirect user back to the client-side dashboard
    const redirectUrl = `${env.CLIENT_URL}/dashboard?installation_id=${installationIdNum}&status=success`;
    logger.info(`Redirecting user to frontend: ${redirectUrl}`);
    res.redirect(redirectUrl);
});
