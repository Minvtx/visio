import { prisma } from "@/lib/db";
import { Job, JobStatus } from "@prisma/client";
import { generateMonthProcessor } from "./processors/month-generator";

export type JobType =
    | 'GENERATE_STRATEGY'
    | 'GENERATE_CALENDAR'
    | 'GENERATE_PIECES'
    | 'REGENERATE_PIECE'
    | 'EXPORT_PDF';

type JobHandler = (job: Job) => Promise<any>;

// Simple in-memory registry for handlers
const handlers: Record<string, JobHandler> = {
    'GENERATE_PIECES': generateMonthProcessor
};

export function registerJobHandler(type: string, handler: JobHandler) {
    handlers[type] = handler;
    console.log(`[MockQueue] Handler registered for: ${type}`);
}

/**
 * Creates a job in the DB and "processes" it immediately (pseudo-async).
 * In a real BullMQ setup, this would add to the queue.
 */
export async function createJob(
    type: JobType,
    payload: any,
    resourceId?: string,
    resourceType?: string,
    userId?: string
) {
    // 1. Create Job Record
    const job = await prisma.job.create({
        data: {
            type,
            payload,
            resourceId,
            resourceType,
            userId,
            status: 'QUEUED',
        }
    });

    console.log(`[MockQueue] Job created: ${job.id} (${type}) - Starting execution...`);

    // 2. Trigger "Async" execution (fire and forget promise)
    // We use setImmediate to ensure it runs in the next tick, not blocking response slightly
    setTimeout(() => processJob(job.id), 100);

    return job;
}

/**
 * The "Worker" logic. 
 * Fetches the job, finds handler, runs it, updates status.
 */
async function processJob(jobId: string) {
    try {
        // 1. Mark Running
        const job = await prisma.job.update({
            where: { id: jobId },
            data: {
                status: 'RUNNING',
                startedAt: new Date(),
                progress: 0
            }
        });

        // 2. Find Handler
        const handler = handlers[job.type];
        if (!handler) {
            throw new Error(`No handler registered for job type: ${job.type}`);
        }

        // 3. Execute
        const result = await handler(job);

        // 4. Mark Completed
        await prisma.job.update({
            where: { id: jobId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                progress: 100,
                result: result ?? {}, // Ensure JSON compatibility
            }
        });

        console.log(`[MockQueue] Job completed: ${jobId}`);

    } catch (error: any) {
        console.error(`[MockQueue] Job failed: ${jobId}`, error);

        // 5. Mark Failed
        await prisma.job.update({
            where: { id: jobId },
            data: {
                status: 'FAILED',
                completedAt: new Date(),
                error: error.message || 'Unknown error'
            }
        });
    }
}
