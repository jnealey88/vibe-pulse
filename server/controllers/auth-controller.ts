import { Request, Response } from 'express';
import { storage } from '../storage';
import { google } from 'googleapis';
import { userInsertSchema } from '@shared/schema';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const authController = {
  // Generate Google OAuth URL for login
  getAuthUrl: (req: Request, res: Response) => {
    try {
      const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/analytics.readonly'
      ];

      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'  // Force the refresh token to be generated
      });

      return res.json({ url });
    } catch (error) {
      console.error('Error generating auth URL:', error);
      return res.status(500).json({ message: 'Failed to generate authentication URL' });
    }
  },

  // Handle Google OAuth callback
  handleAuthCallback: async (req: Request, res: Response) => {
    // Get code from query params (GET) or body (POST)
    const code = req.method === 'GET' ? req.query.code : req.body.code;

    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    try {
      // Get tokens from the code - ensure we're working with a string
      const codeStr = typeof code === 'string' ? code : String(code);
      const { tokens } = await oauth2Client.getToken(codeStr);
      oauth2Client.setCredentials(tokens);

      // Get user info from Google
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      if (!userInfo.data.email) {
        return res.status(400).json({ message: 'Failed to get user email from Google' });
      }

      // Check if user exists
      let user = await storage.getUserByEmail(userInfo.data.email);

      if (!user) {
        // Create new user
        const userData = {
          email: userInfo.data.email,
          name: userInfo.data.name || 'User',
          googleId: userInfo.data.id || '',
          accessToken: tokens.access_token || '',
          refreshToken: tokens.refresh_token || '',
          profileImage: userInfo.data.picture || '',
        };

        // Validate user data
        const validatedData = userInsertSchema.parse(userData);
        user = await storage.insertUser(validatedData);
      } else {
        // Update existing user's tokens
        user = await storage.updateUser(user.id, {
          accessToken: tokens.access_token || user.accessToken,
          refreshToken: tokens.refresh_token || user.refreshToken,
          profileImage: userInfo.data.picture || user.profileImage,
        });
      }

      // Set user session
      req.session.userId = user.id;

      // If it's a GET request (redirect from Google), redirect to dashboard
      if (req.method === 'GET') {
        return res.redirect('/dashboard');
      }
      
      // For API calls (POST), return JSON
      return res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profileImage: user.profileImage,
        }
      });
    } catch (error) {
      console.error('Error in Google callback:', error);
      return res.status(500).json({ message: 'Authentication failed' });
    }
  },

  // Get current user
  getCurrentUser: async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
      });
    } catch (error) {
      console.error('Error getting current user:', error);
      return res.status(500).json({ message: 'Failed to get user information' });
    }
  },

  // Logout
  logout: (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ message: 'Failed to logout' });
      }
      
      res.clearCookie('connect.sid');
      return res.json({ success: true });
    });
  }
};

export default authController;
