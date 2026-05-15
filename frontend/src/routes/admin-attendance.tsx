import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/admin-sidebar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { CalendarDays, Clock, MapPin, Users, Trash2, X, Search, Download, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-attendance")({
  beforeLoad: () => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      throw redirect({ to: '/login' });
    }
  },
  head: () => ({
    meta: [{ title: "Attendance History — Sentinel.edu" }],
  }),
  component: AdminAttendancePage,
});

function AdminAttendancePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['lecturerSessions'],
    queryFn: () => fetchAPI<any>('/api/sessions').then(res => res.data),
    enabled: !!authData?.user
  });

  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: attendanceList, isLoading: attendanceLoading } = useQuery({
    queryKey: ['sessionAttendance', selectedSession?.sessionId],
    queryFn: () => fetchAPI<any>(`/api/sessions/${selectedSession?.sessionId}/attendance`).then(res => res.data),
    enabled: !!selectedSession?.sessionId
  });

  // Search filter
  const filteredList = useMemo(() => {
    if (!attendanceList) return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return attendanceList;
    return attendanceList.filter((r: any) =>
      r.name?.toLowerCase().includes(q) ||
      r.universityRollNo?.toLowerCase().includes(q)
    );
  }, [attendanceList, searchQuery]);

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => fetchAPI(`/api/sessions/${sessionId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success("Session deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['lecturerSessions'] });
      if (selectedSession) setSelectedSession(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete session");
    }
  });

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this session? All associated attendance records will be permanently removed.")) {
      deleteSessionMutation.mutate(sessionId);
    }
  };

  // ── PDF generation ──────────────────────────────────────────────────────────
  const downloadPDF = async () => {
    if (!selectedSession || !attendanceList) return;

    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentW = pageW - margin * 2;

    // ── Header background ─────────────────────────────────────────────────────
    doc.setFillColor(17, 17, 27);          // deep dark
    doc.rect(0, 0, pageW, 50, "F");

    // Brand label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(120, 90, 240);        // purple accent
    doc.text("SENTINEL.EDU", margin, 14);

    // Report title
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text("Attendance Report", margin, 26);

    // Course subtitle
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 200);
    doc.text(selectedSession.courseTitle, margin, 34);

    // Right side meta chip
    const statusLabel = selectedSession.status === "active" ? "ACTIVE" : "ENDED";
    const isActive = selectedSession.status === "active";
    doc.setFillColor(isActive ? 34 : 60, isActive ? 197 : 60, isActive ? 94 : 80);
    doc.roundedRect(pageW - margin - 28, 16, 28, 9, 2, 2, "F");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(statusLabel, pageW - margin - 14, 22, { align: "center" });

    // ── Session meta band ─────────────────────────────────────────────────────
    doc.setFillColor(28, 28, 40);
    doc.rect(0, 50, pageW, 22, "F");

    const metaItems = [
      { label: "Date", value: selectedSession.date },
      { label: "Time", value: `${selectedSession.startTime} – ${selectedSession.endTime}` },
      { label: "Hall", value: selectedSession.hall },
      { label: "Lecturer", value: selectedSession.lecturerName },
    ];

    const colW = contentW / metaItems.length;
    metaItems.forEach((item, idx) => {
      const x = margin + idx * colW;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(120, 90, 240);
      doc.text(item.label.toUpperCase(), x, 58);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(220, 220, 235);
      doc.text(item.value || "—", x, 65);
    });

    // ── Summary row ──────────────────────────────────────────────────────────
    let y = 82;
    doc.setFillColor(240, 240, 255);
    doc.roundedRect(margin, y - 5, contentW, 12, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 80);
    doc.text(`Total Attendees: ${attendanceList.length}`, margin + 4, y + 3);

    const generated = new Date().toLocaleString();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 150);
    doc.text(`Generated: ${generated}`, pageW - margin, y + 3, { align: "right" });

    // ── Table header ──────────────────────────────────────────────────────────
    y += 16;
    const cols = [
      { label: "#",            w: 10 },
      { label: "Full Name",    w: 60 },
      { label: "Matric No.",   w: 50 },
      { label: "Time Scanned", w: 35 },
      { label: "Status",       w: 30 },
    ];

    doc.setFillColor(17, 17, 27);
    doc.rect(margin, y - 4, contentW, 9, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(150, 120, 255);

    let cx = margin + 2;
    cols.forEach(col => {
      doc.text(col.label.toUpperCase(), cx, y + 2);
      cx += col.w;
    });

    y += 9;

    // ── Table rows ────────────────────────────────────────────────────────────
    attendanceList.forEach((record: any, idx: number) => {
      if (y > pageH - 25) {
        doc.addPage();
        y = 20;
        // Repeat header on new page
        doc.setFillColor(17, 17, 27);
        doc.rect(margin, y - 4, contentW, 9, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(150, 120, 255);
        cx = margin + 2;
        cols.forEach(col => {
          doc.text(col.label.toUpperCase(), cx, y + 2);
          cx += col.w;
        });
        y += 9;
      }

      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 245 : 252, isEven ? 245 : 252, isEven ? 255 : 255);
      doc.rect(margin, y - 3.5, contentW, 8.5, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(40, 40, 60);

      cx = margin + 2;
      // Index
      doc.text(String(idx + 1), cx, y + 2); cx += cols[0].w;
      // Name
      doc.setFont("helvetica", "bold");
      doc.text(record.name || "—", cx, y + 2); cx += cols[1].w;
      doc.setFont("helvetica", "normal");
      // Matric
      doc.setTextColor(80, 80, 120);
      doc.text(record.universityRollNo || "—", cx, y + 2); cx += cols[2].w;
      // Time
      doc.setTextColor(60, 60, 80);
      doc.text(record.time || "—", cx, y + 2); cx += cols[3].w;
      // Status pill
      const isPresent = record.status === "present";
      doc.setFillColor(isPresent ? 220 : 255, isPresent ? 255 : 220, isPresent ? 230 : 220);
      doc.roundedRect(cx, y - 2, 25, 6, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(isPresent ? 30 : 160, isPresent ? 150 : 60, isPresent ? 80 : 60);
      doc.text((record.status || "present").toUpperCase(), cx + 12.5, y + 2.5, { align: "center" });

      y += 8.5;
    });

    // ── Footer ────────────────────────────────────────────────────────────────
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(200, 200, 220);
      doc.setLineWidth(0.3);
      doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 180);
      doc.text("Sentinel.edu — Attendance Management System", margin, pageH - 7);
      doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 7, { align: "right" });
    }

    const filename = `Attendance_${selectedSession.courseTitle.replace(/\s+/g, "_")}_${selectedSession.date}.pdf`;
    doc.save(filename);
    toast.success("PDF downloaded successfully!");
  };

  if (authLoading || (authData?.user && authData.user.role !== 'LECTURER')) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading portal...</div>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-7xl px-6 py-10 lg:p-10">
          <header className="mb-10">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Session Management
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Attendance History</h1>
            <p className="mt-2 text-muted-foreground">View past classes and manage student attendance records.</p>
          </header>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sessionsLoading ? (
               <div className="col-span-full text-center py-10 text-muted-foreground animate-pulse">Loading sessions...</div>
            ) : sessions?.length === 0 ? (
               <div className="col-span-full text-center py-10 text-muted-foreground border border-border border-dashed rounded-2xl bg-card/20">No past sessions found. Generate a QR session first.</div>
            ) : (
               sessions?.map((session: any) => (
                 <div 
                   key={session.sessionId} 
                   onClick={() => { setSelectedSession(session); setSearchQuery(""); }}
                   className="rounded-2xl border border-border bg-card/40 p-6 cursor-pointer hover:bg-card/60 transition-colors relative group"
                 >
                   <button 
                     onClick={(e) => handleDelete(e, session.sessionId)}
                     className="absolute top-4 right-4 p-2 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
                     title="Delete Session"
                   >
                     <Trash2 className="size-4" />
                   </button>
                   <div className="flex items-center gap-2 mb-4">
                      <span className={`size-2 rounded-full ${session.status === 'active' ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
                      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{session.status}</span>
                   </div>
                   <h3 className="text-lg font-semibold mb-4 pr-8">{session.courseTitle}</h3>
                   <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2"><CalendarDays className="size-4" /> {session.date}</div>
                      <div className="flex items-center gap-2"><Clock className="size-4" /> {session.startTime} - {session.endTime}</div>
                      <div className="flex items-center gap-2"><MapPin className="size-4" /> {session.hall}</div>
                   </div>
                 </div>
               ))
            )}
          </div>
        </main>
      </div>

      {/* ── Full-screen Attendees Modal ─────────────────────────────────────── */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-background/70 backdrop-blur-sm">
          {/* Backdrop click to close */}
          <div className="flex-1 cursor-pointer" onClick={() => setSelectedSession(null)} />

          {/* Panel — full height, fixed width, internal scroll */}
          <div className="bg-card w-full max-w-2xl h-full flex flex-col border-l border-border shadow-2xl">
            
            {/* ── Modal Header ──────────────────────────────────────────────── */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-border shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="size-4 text-primary" />
                  <h2 className="text-lg font-semibold">Attendees List</h2>
                </div>
                <p className="text-xs text-muted-foreground font-medium">{selectedSession.courseTitle}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedSession.date} · {selectedSession.startTime}–{selectedSession.endTime} · {selectedSession.hall}
                </p>
              </div>
              <button 
                onClick={() => setSelectedSession(null)} 
                className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors mt-0.5"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* ── Search + Download bar ─────────────────────────────────────── */}
            <div className="px-6 py-4 border-b border-border shrink-0 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by name or matric number…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background/60 pl-9 pr-4 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                onClick={downloadPDF}
                disabled={!attendanceList?.length}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Download className="size-4" />
                PDF
              </button>
            </div>

            {/* ── Count badge ───────────────────────────────────────────────── */}
            {!attendanceLoading && attendanceList && (
              <div className="px-6 py-2.5 shrink-0 flex items-center gap-2 bg-card/30">
                <FileText className="size-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {filteredList.length} of {attendanceList.length} student{attendanceList.length !== 1 ? "s" : ""}
                  {searchQuery && " matching search"}
                </span>
              </div>
            )}

            {/* ── Scrollable body ───────────────────────────────────────────── */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {attendanceLoading ? (
                <div className="text-center py-16 text-muted-foreground animate-pulse">Loading attendees...</div>
              ) : attendanceList?.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground border border-border border-dashed rounded-xl bg-background/50">
                  No attendees recorded for this session.
                </div>
              ) : filteredList.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground border border-border border-dashed rounded-xl bg-background/50">
                  No results for "<span className="text-foreground">{searchQuery}</span>"
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredList.map((record: any, idx: number) => (
                    <div 
                      key={record._id} 
                      className="flex items-center gap-4 rounded-xl border border-border bg-card/40 px-4 py-3.5 hover:bg-card/70 transition-colors"
                    >
                      {/* Index bubble */}
                      <div className="size-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{record.name}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">{record.universityRollNo}</div>
                      </div>
                      {/* Time */}
                      <div className="text-xs text-muted-foreground font-mono shrink-0">{record.time}</div>
                      {/* Status */}
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        record.status === 'present' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-warning/10 text-warning'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Modal Footer ──────────────────────────────────────────────── */}
            <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Session · <span className={selectedSession.status === 'active' ? 'text-success' : 'text-muted-foreground'}>{selectedSession.status}</span>
              </span>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Close panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
