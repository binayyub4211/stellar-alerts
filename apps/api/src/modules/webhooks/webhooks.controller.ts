import { FastifyRequest, FastifyReply } from 'fastify';
import { createWebhookSchema, webhookParamsSchema } from './webhooks.schema';
import { webhooksService } from './webhooks.service';
import { NotFoundError, zodValidationError } from '../../lib/errors';

export class WebhooksController {
  async addWebhook(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createWebhookSchema.safeParse(request.body);
    if (!parsed.success) {
      throw zodValidationError(parsed, 'Invalid payload');
    }

    const userId = (request as any).user.id;
    const webhook = await webhooksService.addWebhook(userId, parsed.data.url, parsed.data.payloadTemplate);
    return reply.status(201).send({ success: true, webhook });
  }

  async getWebhooks(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const webhooks = await webhooksService.getWebhooks(userId);
    return reply.send({ success: true, webhooks });
  }

  async deleteWebhook(request: FastifyRequest, reply: FastifyReply) {
    const parsed = webhookParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      throw zodValidationError(parsed, 'Invalid parameters');
    }

    try {
      const userId = (request as any).user.id;
      await webhooksService.removeWebhook(parsed.data.id, userId);
      return reply.send({ success: true });
    } catch (error: any) {
      if (error.message === 'Webhook not found') {
        throw new NotFoundError(error.message);
      }
      throw error;
    }
  }

  async testWebhook(request: FastifyRequest, reply: FastifyReply) {
    const parsed = webhookParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      throw zodValidationError(parsed, 'Invalid parameters');
    }

    try {
      const userId = (request as any).user.id;
      const result = await webhooksService.sendTestWebhook(parsed.data.id, userId);
      return reply.send({ success: result.success, result });
    } catch (error: any) {
      if (error.message === 'Webhook not found') {
        throw new NotFoundError(error.message);
      }
      throw error;
    }
  }
}

export const webhooksController = new WebhooksController();