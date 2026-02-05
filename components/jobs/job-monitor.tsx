"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

interface JobMonitorProps {
    jobId: string;
    onComplete?: (result: any) => void;
    onError?: (error: any) => void;
}

export function JobMonitor({ jobId, onComplete, onError }: JobMonitorProps) {
    const [status, setStatus] = useState<"QUEUED" | "RUNNING" | "COMPLETED" | "FAILED">("RUNNING");
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!jobId) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/jobs/${jobId}`);
                if (!res.ok) return;

                const job = await res.json();

                setStatus(job.status);
                setProgress(job.progress);

                if (job.status === "COMPLETED") {
                    clearInterval(interval);
                    onComplete?.(job.result);
                    toast({
                        title: "Generación completada",
                        description: "El contenido ha sido generado exitosamente.",
                        variant: "default",
                    });
                } else if (job.status === "FAILED") {
                    clearInterval(interval);
                    onError?.(job.error);
                    toast({
                        title: "Error en la generación",
                        description: job.error || "Ocurrió un error inesperado.",
                        variant: "destructive",
                    });
                }
            } catch (err) {
                console.error("Error polling job:", err);
            }
        }, 2000); // Poll every 2 seconds

        return () => clearInterval(interval);
    }, [jobId, onComplete, onError]);

    if (status === "COMPLETED") return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
            <div className="bg-card border shadow-lg rounded-lg p-4 w-80 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Generando Contenido...</h4>
                    <Badge variant={status === "FAILED" ? "error" : "default"}>
                        {status}
                    </Badge>
                </div>

                {status === "RUNNING" || status === "QUEUED" ? (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span>Procesando... esto puede tomar unos minutos.</span>
                    </div>
                ) : status === "FAILED" ? (
                    <div className="flex items-center gap-3 text-sm text-destructive">
                        <XCircle className="h-4 w-4" />
                        <span>Error en la generación.</span>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
