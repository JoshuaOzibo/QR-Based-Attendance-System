import { createFileRoute } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/admin-sidebar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { CalendarDays, Clock, MapPin, Users, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-attendance")({
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

  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const { data: attendanceList, isLoading: attendanceLoading } = useQuery({
    queryKey: ['sessionAttendance', selectedSession],
    queryFn: () => fetchAPI<any>(`/api/sessions/${selectedSession}/attendance`).then(res => res.data),
    enabled: !!selectedSession
  });

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
                   onClick={() => setSelectedSession(session.sessionId)}
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
                   <h3 className="text-lg font-semibold mb-4">{session.courseTitle}</h3>
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

      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-3xl max-h-[80vh] rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden">
             <div className="flex items-center justify-between p-6 border-b border-border bg-card/80">
                <h2 className="text-xl font-semibold flex items-center gap-2"><Users className="size-5" /> Attendees List</h2>
                <button onClick={() => setSelectedSession(null)} className="p-2 hover:bg-muted rounded-md"><X className="size-5" /></button>
             </div>
             <div className="p-6 overflow-y-auto flex-1">
                {attendanceLoading ? (
                  <div className="text-center py-10 text-muted-foreground animate-pulse">Loading attendees...</div>
                ) : attendanceList?.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground border border-border border-dashed rounded-xl bg-background/50">No attendees recorded for this session.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-background text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-semibold rounded-tl-lg rounded-bl-lg">Student</th>
                          <th className="px-4 py-3 font-semibold">Matric No</th>
                          <th className="px-4 py-3 font-semibold">Time Scanned</th>
                          <th className="px-4 py-3 font-semibold text-right rounded-tr-lg rounded-br-lg">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {attendanceList?.map((record: any) => (
                          <tr key={record._id} className="transition-colors hover:bg-muted/50">
                            <td className="px-4 py-3.5 font-medium">{record.name}</td>
                            <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">{record.universityRollNo}</td>
                            <td className="px-4 py-3.5 font-mono text-xs">{record.time}</td>
                            <td className="px-4 py-3.5 text-right">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${record.status === 'present' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                {record.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
