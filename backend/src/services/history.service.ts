import { prisma } from '../utils/prisma.js';

export const historyService = {
  async record(
    planId: string,
    action: string,
    entityType: string,
    entityId: string,
    oldData: unknown,
    newData: unknown
  ): Promise<void> {
    try {
      await prisma.historyEntry.create({
        data: {
          planId,
          action,
          entityType,
          entityId,
          oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
          newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
        },
      });
    } catch (error) {
      // Log but don't fail the main operation
      console.error('Failed to record history:', error);
    }
  },
};
