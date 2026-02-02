import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Camera, BarChart3, Settings } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/lists', icon: BookOpen, label: 'Lijsten' },
  { path: '/scan', icon: Camera, label: 'Scan' },
  { path: '/stats', icon: BarChart3, label: 'Stats' },
  { path: '/settings', icon: Settings, label: 'Instellingen' },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-20">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t safe-bottom">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path ||
              (path !== '/' && location.pathname.startsWith(path));

            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${
                  isActive
                    ? 'text-primary-500'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
