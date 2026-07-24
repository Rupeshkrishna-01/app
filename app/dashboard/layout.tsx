import { Navbar } from '@/components/navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 max-w-md mx-auto relative">
      <main className="flex-1 p-4 sm:p-6">{children}</main>
      <Navbar />
    </div>
  );
}
