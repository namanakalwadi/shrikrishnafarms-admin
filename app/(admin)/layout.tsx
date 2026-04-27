import AdminNav from "@/components/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminNav />
      <main className="flex-1 overflow-auto pt-12 pb-16 md:pt-0 md:pb-0">
        {children}
      </main>
    </div>
  );
}
