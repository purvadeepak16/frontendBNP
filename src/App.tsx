import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Grid,
  BookOpen,
  History,
  Database,
  Scale,
  Shield,
  FileText
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { NewAssessment } from './pages/NewAssessment';
import { AssessmentResult } from './pages/AssessmentResult';
import { ConflictHeatmap } from './pages/ConflictHeatmap';
import { EvidenceExplorer } from './pages/EvidenceExplorer';
import { HistoryReports } from './pages/HistoryReports';
import { RegulatoryLibrary } from './pages/RegulatoryLibrary';
import { ModelEvaluation } from './pages/ModelEvaluation';

const NavigationSidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Compliance Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'New Change Request', path: '/new', icon: PlusCircle },
    { label: 'Conflict Heatmap', path: '/heatmap', icon: Grid },
    { label: 'Evidence & Reasoning', path: '/evidence', icon: BookOpen },
    { label: 'Audit History & Reports', path: '/history', icon: History },
    { label: 'Regulatory Library', path: '/library', icon: Database },
    { label: 'Benchmark Evaluation', path: '/evaluation', icon: Scale }
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col justify-between bg-slate-900 border-r border-slate-800 p-4 min-h-[calc(100vh-53px)]">
      <div className="space-y-6">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3">
            Core Navigation
          </span>
          <nav className="mt-2 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Monitored Regulatory Jurisdictions Status Widget */}
        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Monitored Regimes</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
              5 Active
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-300 space-y-1 pt-1 border-t border-slate-800/60">
            <div className="flex justify-between">
              <span>EMIR Refit</span>
              <span className="text-slate-500">EU / ESMA</span>
            </div>
            <div className="flex justify-between">
              <span>UK EMIR</span>
              <span className="text-slate-500">FCA / BoE</span>
            </div>
            <div className="flex justify-between">
              <span>ASIC</span>
              <span className="text-slate-500">Australia</span>
            </div>
            <div className="flex justify-between">
              <span>MAS</span>
              <span className="text-slate-500">Singapore</span>
            </div>
            <div className="flex justify-between">
              <span>HKMA</span>
              <span className="text-slate-500">Hong Kong</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
        <div className="font-semibold text-slate-400 flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-blue-500" />
          <span>IMPART Decision Support</span>
        </div>
        <p className="leading-tight">BNP Paribas Compliance Engineering</p>
      </div>
    </aside>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        {/* Top Navigation conforming to Top Bar Contract */}
        <Navbar />

        {/* Workspace Canvas: Sidebar + Main Content Viewport */}
        <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
          <NavigationSidebar />

          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/new" element={<NewAssessment />} />
              <Route path="/assessment/:id" element={<AssessmentResult />} />
              <Route path="/heatmap" element={<ConflictHeatmap />} />
              <Route path="/evidence" element={<EvidenceExplorer />} />
              <Route path="/history" element={<HistoryReports />} />
              <Route path="/library" element={<RegulatoryLibrary />} />
              <Route path="/evaluation" element={<ModelEvaluation />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
