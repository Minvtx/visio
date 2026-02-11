import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { generateMonthContent } from "@/lib/inngest/functions";

export const dynamic = 'force-dynamic';

// This endpoint is called by Inngest's cloud to execute background functions.
// Inngest sends HTTP requests to this route, bypassing Vercel's 10s timeout.
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [generateMonthContent],
    signingKey: process.env.INNGEST_SIGNING_KEY_MANUAL || process.env.INNGEST_SIGNING_KEY,
});
