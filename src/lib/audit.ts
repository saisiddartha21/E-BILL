import prisma from '@/lib/db';

export interface AuditLogParams {
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  details?: string | object;
  ipAddress?: string;
}

/**
 * Flexible audit logging function that handles multiple call signatures:
 * 1. logAudit({ userId, action, entity, entityId, details })
 * 2. logAudit(userId, action, entity, entityId, details)
 * 3. logAudit(prismaClient, { userId, action, entity, entityId, details })
 */
export async function logAudit(
  firstArg: AuditLogParams | string | any,
  secondArg?: AuditLogParams | string,
  thirdArg?: string,
  fourthArg?: string,
  fifthArg?: any
) {
  try {
    let params: AuditLogParams;
    let dbClient = prisma;

    if (typeof firstArg === 'object' && 'action' in firstArg) {
      // Pattern 1: logAudit({ userId, action, ... })
      params = firstArg as AuditLogParams;
    } else if (typeof firstArg === 'string' && typeof secondArg === 'string') {
      // Pattern 2: logAudit(userId, action, entity, entityId, details)
      params = {
        userId: firstArg,
        action: secondArg,
        entity: thirdArg || '',
        entityId: fourthArg || '',
        details: fifthArg,
      };
    } else if (typeof firstArg === 'object' && typeof secondArg === 'object' && 'action' in secondArg) {
      // Pattern 3: logAudit(prismaClient, { userId, action, ... })
      dbClient = firstArg;
      params = secondArg as AuditLogParams;
    } else {
      console.error('Invalid logAudit call signature');
      return;
    }

    const detailsStr = typeof params.details === 'object'
      ? JSON.stringify(params.details)
      : (params.details || '');

    await dbClient.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entity: params.entity || '',
        entityId: params.entityId || '',
        details: detailsStr,
        ipAddress: params.ipAddress || '',
      }
    });
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error('Audit log error:', error);
  }
}
