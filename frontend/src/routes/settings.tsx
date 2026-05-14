import { createFileRoute } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/admin-sidebar";
import { StudentSidebar } from "@/components/student-sidebar";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import { useNavigate } from "@tanstack/react-router";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Account Settings — Sentinel.edu" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
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
    }
  }, [authError, navigate]);

  const [form, setForm] = useState({
    name: "",
    universityRollNo: "",
    password: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (authData?.user) {
      setForm(prev => ({
        ...prev,
        name: authData.user.name || "",
        universityRollNo: authData.user.universityRollNo || "",
      }));
    }
  }, [authData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: any = {
        name: form.name,
        universityRollNo: form.universityRollNo,
      };
      if (form.password) {
        payload.password = form.password;
      }

      await fetchAPI('/api/auth/update', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      toast.success("Profile updated successfully!");
      setForm(prev => ({ ...prev, password: "" }));
      queryClient.invalidateQueries({ queryKey: ['authMe'] });
    } catch (err: any) {
      toast.error("Failed to update profile", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !authData?.user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading settings...</div>;
  }

  const role = authData.user.role;
  const isStudent = role === 'STUDENT';
  const idLabel = isStudent ? "Matric Number" : "Lecturer ID";

  return (
    <div className="flex min-h-screen bg-background">
      {isStudent ? <StudentSidebar /> : <AdminSidebar />}
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-4xl px-6 py-10 lg:p-10">
          <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                System
              </div>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">Account Settings</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Manage your personal profile and security credentials.
              </p>
            </div>
          </header>

          <div className="rounded-2xl border border-border bg-card/40 p-6 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Full Name</label>
                  <input 
                    required
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Enter your full name"
                    className="w-full rounded-md border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">{idLabel}</label>
                  <input 
                    required
                    value={form.universityRollNo}
                    onChange={e => setForm({...form, universityRollNo: e.target.value})}
                    placeholder={`Enter your ${idLabel.toLowerCase()}`}
                    className="w-full rounded-md border border-border bg-card px-4 py-2.5 text-sm font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Update Password</label>
                <input 
                  type="password"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  placeholder="Leave blank to keep current password"
                  className="w-full sm:max-w-md rounded-md border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Minimum 8 characters. You will remain logged in after changing your password.
                </p>
              </div>

              <div className="pt-6">
                <button 
                  type="submit" 
                  disabled={isSaving} 
                  className="inline-flex items-center gap-2 rounded-md bg-[image:var(--gradient-primary)] px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02] disabled:opacity-50"
                >
                  {isSaving ? (
                    <><Loader2 className="size-4 animate-spin" /> Saving Changes...</>
                  ) : (
                    <><Save className="size-4" /> Save Changes</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
