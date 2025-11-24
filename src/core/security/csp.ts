/**
 * Content Security Policy (CSP) - T055
 * Defines strict CSP headers to prevent XSS and injection attacks
 */

import { session } from 'electron';
import { logger } from '../logging/logger';

/**
 * CSP Configuration for the application
 * Strict policy to prevent XSS, clickjacking, and other attacks
 */
export class CSPManager {
  /**
   * Apply CSP headers to the main window session
   */
  static applyCSP(): void {
    const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

    // CSP directives
    const cspDirectives = {
      // Only allow scripts from same origin and inline (needed for Vite in dev)
      'script-src': isDev
        ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'http://localhost:5173']
        : ["'self'"],

      // Only allow styles from same origin and inline
      'style-src': ["'self'", "'unsafe-inline'"],

      // Only allow images from same origin, data URIs, and https
      'img-src': ["'self'", 'data:', 'https:'],

      // Only allow fonts from same origin and data URIs
      'font-src': ["'self'", 'data:'],

      // Only allow connections to same origin and https
      'connect-src': isDev
        ? ["'self'", 'ws://localhost:5173', 'http://localhost:5173', 'https:']
        : ["'self'", 'https:'],

      // Disallow all object/embed/applet
      'object-src': ["'none'"],

      // Require HTTPS for all external resources
      'upgrade-insecure-requests': [],

      // Prevent framing (clickjacking protection)
      'frame-ancestors': ["'none'"],

      // Default fallback - only same origin
      'default-src': ["'self'"],

      // Allow child frames from same origin and https (for AI providers)
      'frame-src': ["'self'", 'https:'],

      // Only allow media from same origin and https
      'media-src': ["'self'", 'https:'],

      // Block all workers except same origin
      'worker-src': ["'self'"],

      // Prevent MIME type sniffing
      'base-uri': ["'self'"],

      // Restrict form submissions to same origin
      'form-action': ["'self'"]
    };

    // Build CSP header string
    const cspHeader = Object.entries(cspDirectives)
      .map(([directive, values]) => {
        if (values.length === 0) {
          return directive;
        }
        return `${directive} ${values.join(' ')}`;
      })
      .join('; ');

    logger.info('Applying Content Security Policy', {
      isDev,
      policy: cspHeader
    });

    // Apply CSP to default session
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [cspHeader],
          // Additional security headers
          'X-Content-Type-Options': ['nosniff'],
          'X-Frame-Options': ['DENY'],
          'X-XSS-Protection': ['1; mode=block'],
          'Referrer-Policy': ['strict-origin-when-cross-origin'],
          'Permissions-Policy': [
            'camera=(), microphone=(), geolocation=(), payment=()'
          ]
        }
      });
    });

    logger.info('CSP and security headers applied successfully');
  }

  /**
   * Configure session permissions
   */
  static configurePermissions(): void {
    logger.info('Configuring session permissions');

    // Deny all permission requests by default
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      logger.warn(`Permission request denied: ${permission}`, {
        url: webContents.getURL()
      });
      callback(false);
    });

    // Block specific permission checks
    session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
      logger.debug(`Permission check: ${permission}`, {
        url: webContents?.getURL()
      });
      // Deny all permissions by default for security
      return false;
    });

    // Configure web request filtering
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
      // Block file:// protocol in production
      if (details.url.startsWith('file://') && process.env.NODE_ENV === 'production') {
        logger.warn('Blocked file:// protocol request in production', {
          url: details.url
        });
        callback({ cancel: true });
        return;
      }

      // Allow request
      callback({ cancel: false });
    });

    logger.info('Session permissions configured successfully');
  }

  /**
   * Disable insecure features
   */
  static disableInsecureFeatures(): void {
    logger.info('Disabling insecure features');

    // Disable eval() and Function() constructor
    if (process.env.NODE_ENV === 'production') {
      // This is handled by CSP, but we log it
      logger.info('Eval and Function constructor disabled via CSP in production');
    }

    // Clear cache on startup in production for security
    if (process.env.NODE_ENV === 'production') {
      session.defaultSession.clearCache().then(() => {
        logger.info('Session cache cleared on startup');
      }).catch(err => {
        logger.error('Failed to clear session cache', err as Error);
      });
    }

    logger.info('Insecure features disabled successfully');
  }

  /**
   * Initialize all security measures
   */
  static initialize(): void {
    logger.info('Initializing CSP Manager (T055)');

    try {
      this.applyCSP();
      this.configurePermissions();
      this.disableInsecureFeatures();

      logger.info('CSP Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize CSP Manager', error as Error);
      throw error;
    }
  }
}
