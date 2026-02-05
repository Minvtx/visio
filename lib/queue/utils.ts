import { prisma } from "@/lib/db";
import { Job } from "@prisma/client";

/**
 * Updates the progress of a job.
 * Use this within your job handlers to report status to UI.
 */
export async function updateJobProgress(jobId: string, progress: number) {
    await prisma.job.update({
        where: { id: jobId },
        data: { progress }
    });
}

/**
 * Helper to get a job status
 */
export async function getJob(jobId: string) {
    return prisma.job.findUnique({
        where: { id: jobId }
    });
}
