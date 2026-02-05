import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const job = await prisma.job.findUnique({
            where: { id: params.id },
        });

        if (!job) {
            return new NextResponse("Job not found", { status: 404 });
        }

        return NextResponse.json(job);
    } catch (error) {
        console.error("[JOB_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
