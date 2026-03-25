import { ThemeToggle } from "./theme-toggle";
import { UserProfile } from "./UserProfile";
import { MobileSidebar } from "./MobileSidebar";
import { NotificationDropdown } from "./NotificationDropdown";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = () => {
    if (searchTerm.trim()) {
      toast.info(`Buscando por: ${searchTerm}`);
      // TODO: Implementar lógica de busca global
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <header className="fixed top-0 z-50 flex h-[60px] items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6 w-full">
      <div className="flex items-center gap-2">
        <MobileSidebar />
        <a
          href="/dashboard"
          className="flex items-center gap-2 font-semibold cursor-pointer hover:opacity-80 transition-opacity"
          aria-label="Ir para o dashboard"
        >
          <img src={`/logo.png?t=${new Date().getTime()}`} alt="Logo" className="h-8 w-8" />
          <span className="text-xl whitespace-nowrap">
            <span className="italic bg-gradient-to-r from-cyan-400 to-primary bg-clip-text text-transparent">
              delivery
            </span>
            <span className="text-primary">noazul</span>
          </span>
        </a>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        {searchOpen ? (
          <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-5">
            <Input
              type="search"
              placeholder="Buscar..."
              className="h-8 w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setSearchOpen(false);
                setSearchTerm("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Buscar"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
          </Button>
        )}

        <NotificationDropdown />

        <div className="hidden md:flex">
          <ThemeToggle />
        </div>
        <UserProfile />
      </div>
    </header>
  );
}
