import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const links = [
    { label: 'Dashboard', path: '/' },
    { label: 'Heatmap', path: '/heatmap' },
    { label: 'Evidence', path: '/evidence' },
    { label: 'History', path: '/history' },
    { label: 'Library', path: '/library' },
    { label: 'Evaluation', path: '/evaluation' }
  ];

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900 border-b border-slate-800">
      {/* Zone 1: Single text element wordmark */}
      <Link to="/" className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2">
        <span className="text-blue-500">IMPART</span>
        <span className="text-slate-500 font-normal">|</span>
        <span className="text-slate-300 font-medium text-xs tracking-wider uppercase">BNP Paribas Compliance</span>
      </Link>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        {links.map(link => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                isActive
                  ? 'text-white border-b-2 border-blue-500 font-semibold'
                  : 'hover:text-slate-200'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <Link
          to="/new"
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 shadow-xs"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>New Assessment</span>
        </Link>
      </div>
    </header>
  );
};
