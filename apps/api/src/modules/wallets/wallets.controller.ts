import { FastifyRequest, FastifyReply } from 'fastify';
import { createWalletSchema, deleteWalletSchema } from './wallets.schema';
import { walletsService } from './wallets.service';
import { ConflictError, NotFoundError, ValidationError, zodValidationError } from '../../lib/errors';

export class WalletsController {
  async addWallet(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createWalletSchema.safeParse(request.body);
    if (!parsed.success) {
      throw zodValidationError(parsed, 'Invalid payload');
    }

    const userId = (request as any).user.id;
    try {
      const wallet = await walletsService.addWallet(
        userId,
        parsed.data.publicKey,
        parsed.data.label,
        parsed.data.zkProof,
        parsed.data.publicSignals
      );
      return reply.status(201).send({ success: true, wallet });
    } catch (error: any) {
      if (error.message === 'Invalid ZK proof') {
        throw new ValidationError('Invalid ZK proof');
      }
      if (error.message === 'Wallet already exists' || error.code === 'P2002') {
        throw new ConflictError('Wallet address is already registered');
      }
      throw error;
    }
  }

  async getWallets(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const wallets = await walletsService.getWallets(userId);
    return reply.send({ success: true, wallets });
  }

  async getIngestionStatus(request: FastifyRequest, reply: FastifyReply) {
    const parsed = deleteWalletSchema.safeParse(request.params);
    if (!parsed.success) {
      throw zodValidationError(parsed, 'Invalid parameters');
    }

    const userId = (request as any).user.id;
    try {
      const ingestion = await walletsService.getIngestionStatus(userId, parsed.data.id);
      return reply.send({ success: true, ingestion });
    } catch (error: any) {
      if (error.message === 'Wallet not found') {
        throw new NotFoundError(error.message);
      }
      throw error;
    }
  }

  async deleteWallet(request: FastifyRequest, reply: FastifyReply) {
    const parsed = deleteWalletSchema.safeParse(request.params);
    if (!parsed.success) {
      throw zodValidationError(parsed, 'Invalid parameters');
    }

    try {
      await walletsService.removeWallet(parsed.data.id);
      return reply.send({ success: true });
    } catch (error: any) {
      if (error.message === 'Wallet not found') {
        throw new NotFoundError(error.message);
      }
      throw error;
    }
  }
}

export const walletsController = new WalletsController();
