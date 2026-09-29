/**
 * Notifications Routes
 */

import { FastifyInstance } from 'fastify';
import { notificationsController } from './notifications.controller';
import { authenticateHook } from '../../middleware/auth.middleware';

export async function notificationsRoutes(app: FastifyInstance) {
  // Notification Preferences (MFA protected update)
  app.post(
    '/notifications/preferences',
    { preHandler: [authenticateHook] },
    notificationsController.updatePreferences.bind(notificationsController)
  );

  app.get(
    '/notifications/preferences',
    { preHandler: [authenticateHook] },
    notificationsController.getPreferences.bind(notificationsController)
  );

  // Freelancer Channel Preferences setup flow (#259)
  app.post(
    '/freelancer/preferences',
    { preHandler: [authenticateHook] },
    notificationsController.updateFreelancerPreferences.bind(notificationsController)
  );

  app.get(
    '/freelancer/preferences',
    { preHandler: [authenticateHook] },
    notificationsController.getFreelancerPreferences.bind(notificationsController)
  );

  // Telegram Account Linking with expiring one-time sync codes (#260)
  app.post(
    '/notifications/telegram/sync-code',
    { preHandler: [authenticateHook] },
    notificationsController.generateTelegramSyncCode.bind(notificationsController)
  );

  app.post(
    '/notifications/telegram/confirm-sync',
    notificationsController.confirmTelegramSync.bind(notificationsController)
  );

  app.get(
    '/notifications/telegram/sync-status/:code',
    notificationsController.getTelegramSyncStatus.bind(notificationsController)
  );

  app.post(
    '/notifications/telegram/unlink',
    { preHandler: [authenticateHook] },
    notificationsController.unlinkTelegram.bind(notificationsController)
  );

  // Test Ping (supports telegram and push protocol)
  app.post(
    '/notifications/test-ping',
    { preHandler: [authenticateHook] },
    notificationsController.sendTestPing.bind(notificationsController)
  );
}
