import { createFileRoute } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Play, Square } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin-qr")({
  head: () => ({
    meta: [{ title: "Generate QR — Sentinel.edu" }],
  }),
  component: AdminQRPage,
});

function AdminQRPage() {
  const navigate = useNavigate();

  const { data: authData, isLoading: authLoading, error: authError } = useQuery({
    queryKey: ['authMe'],
    queryFn: () => fetchAPI<any>('/api/auth/me'),
    retry: false
  });

  useEffect(() => {
    if (authError) {
      navigate({ to: '/login' });
    } else if (authData?.user && authData.user.role !== 'LECTURER') {
      navigate({ to: '/dashboard' });
    }
  }, [authData, authError, navigate]);

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateQR = async () => {
    setIsGenerating(true);
    try {
      const res = await fetchAPI<any>("/api/attendance/generate-qr", { method: "POST" });
      setQrCode(res.qrCode);
    } catch (error) {
      console.error("Failed to generate QR:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (authLoading || (authData?.user && authData.user.role !== 'LECTURER')) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading portal...</div>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-7xl px-6 py-10 lg:p-10">
          <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Session Management
              </div>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">Active QR Session</h1>
            </div>
          </header>

          <div className="rounded-2xl border border-border bg-card/40 p-6 sm:p-10 text-center flex flex-col items-center justify-center min-h-[500px]">
            {qrCode ? (
              <>
                <div className="mb-6 text-[14px] font-bold uppercase tracking-[0.2em] text-success">
                  ● Session Active · 11m elapsed
                </div>
                <h2 className="mb-8 text-3xl font-semibold tracking-tight">Scan to mark attendance</h2>
                <div className="rounded-2xl border border-border bg-white p-4 shadow-[var(--shadow-glow)]">
                  <img src={qrCode} alt="Scan to mark attendance" className="w-[400px] h-[400px]" />
                </div>
                
                <div className="mt-10 flex gap-4">
                  <button onClick={handleGenerateQR} disabled={isGenerating} className="inline-flex items-center gap-2 rounded-md border border-border bg-card/80 px-6 py-3 text-sm font-semibold transition-colors hover:bg-card disabled:opacity-50">
                    <Play className="size-4" /> {isGenerating ? "Regenerating..." : "Regenerate QR"}
                  </button>
                  <button onClick={() => setQrCode(null)} className="inline-flex items-center gap-2 rounded-md bg-destructive/15 px-6 py-3 text-sm font-semibold text-destructive ring-1 ring-destructive/30 transition-colors hover:bg-destructive/25">
                    <Square className="size-4" /> End Session
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6 rounded-full bg-[image:var(--gradient-primary)] p-4 shadow-[var(--shadow-glow)]">
                  <Play className="size-8 text-white" />
                </div>
                <h2 className="mb-2 text-2xl font-semibold tracking-tight">No Active Session</h2>
                <p className="mb-8 text-muted-foreground">Generate a QR code to start accepting live attendance.</p>
                <button onClick={handleGenerateQR} disabled={isGenerating} className="inline-flex items-center gap-2 rounded-md bg-[image:var(--gradient-primary)] px-8 py-4 text-base font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02] disabled:opacity-50">
                  <Play className="size-5" /> {isGenerating ? "Generating..." : "Start New Session"}
                </button>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
