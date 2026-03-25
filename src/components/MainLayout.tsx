import { ReactNode } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { SidebarInset } from "@/components/ui/sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <div className="flex flex-1 w-full pt-[60px]">
        <AppSidebar />
        <SidebarInset>
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </div>
  );
}