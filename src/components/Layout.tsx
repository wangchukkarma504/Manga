import { Outlet, NavLink } from 'react-router-dom';
import { Home, Search, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export default function Layout() {
  return (
    <div className="flex flex-col h-[100dvh] bg-zinc-950 text-zinc-50 overflow-hidden">
      <main className="flex-1 overflow-y-auto pb-16 hide-scrollbar">
        <Outlet />
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-zinc-900 border-t border-zinc-800 flex items-center justify-around px-2 z-50">
        <NavItem to="/" icon={<Home size={24} />} label="Home" />
        <NavItem to="/search" icon={<Search size={24} />} label="Search" />
        <NavItem to="/favorites" icon={<Heart size={24} />} label="Favorites" />
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center justify-center w-16 h-full space-y-1 text-[10px] sm:text-xs transition-colors",
          isActive ? "text-emerald-500" : "text-zinc-500 hover:text-zinc-300"
        )
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
