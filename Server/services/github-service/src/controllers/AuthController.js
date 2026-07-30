import mongoose from 'mongoose';
import { env } from '../config/env.js';
import * as githubApiService from '../services/GitHubApiService.js';
import * as installationService from '../services/InstallationService.js';
import { UserModel } from '../models/UserModel.js';
import { signToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';

// Redirect user to GitHub OAuth login page
export const loginRedirect = (req, res) => {
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&scope=user:email,repo`;
  res.json({ url: redirectUrl });
};

// Handle GitHub OAuth callback
export const handleCallback = async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      throw new ApiError(400, 'Code parameter is required.');
    }

    logger.info('Exchanging OAuth code for token...');
    const accessToken = await githubApiService.getOAuthAccessToken(code);

    logger.info('Fetching user profile details from GitHub...');
    const profile = await githubApiService.getUserProfile(accessToken);

    let userId = `github_${profile.id}`;
    let userEmail = profile.email || `${profile.login}@users.noreply.github.com`;
    let userName = profile.name || profile.login;
    let userRole = 'maintainer';

    // Save user or update credentials if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      try {
        let user = await UserModel.findOne({ email: userEmail });
        if (!user) {
          user = new UserModel({
            name: userName,
            email: userEmail,
            githubId: profile.id,
            githubUsername: profile.login,
            githubAccessToken: accessToken,
            role: userRole
          });
        } else {
          user.githubId = profile.id;
          user.githubUsername = profile.login;
          user.githubAccessToken = accessToken;
        }
        await user.save();
        userId = user._id.toString();
        userRole = user.role;
      } catch (err) {
        logger.warn(`Could not save user to DB: ${err.message}. Proceeding with session token.`);
      }
    } else {
      logger.warn('MongoDB not connected. Using session token without database persistence.');
    }

    // Generate local JWT token
    const token = signToken({
      id: userId,
      email: userEmail,
      name: userName,
      role: userRole
    });

    res.json({
      message: 'Successfully authenticated with GitHub',
      token,
      user: {
        id: userId,
        name: userName,
        email: userEmail,
        githubUsername: profile.login
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /auth/install - Return dynamic installation URL
export const getInstallUrl = async (req, res, next) => {
  try {
    const slug = await githubApiService.getAppSlug();
    const installUrl = `https://github.com/apps/${slug}/installations/new`;
    res.json({ url: installUrl });
  } catch (err) {
    next(err);
  }
};

// GET /auth/installation/callback - Handle setup redirect after App installation
export const handleInstallationCallback = async (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
};
