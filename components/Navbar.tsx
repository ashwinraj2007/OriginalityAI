'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { 
  ShieldCheck, 
  GraduationCap, 
  LogOut, 
  Sparkles, 
  BookOpen, 
  Repeat, 
  CheckCheck,
  FileCheck2,
  Crown,
  CreditCard,
  KeyRound
} from 'lucide-react';

interface NavbarProps {
  onOpenHistory?: () => void;
  historyCount?: number;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export default function Navbar({ 
  onOpenHistory, 
  historyCount = 0,
  activeTab = 'plagiarism',
  onSelectTab
}: NavbarProps) {
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const isStudent = user?.isStudent === true;
  const isPaid = user?.isPaid === true;

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <div className="brand" onClick={() => onSelectTab && onSelectTab('plagiarism')} style={{ cursor: 'pointer' }}>
          <div className="brand-logo">
            <ShieldCheck className="brand-icon" size={24} />
          </div>
          <div className="brand-text">
            <span className="brand-title">Originality<span className="brand-gradient">AI</span></span>
            <span className="brand-tagline">Academic & Pro Integrity Suite</span>
          </div>
        </div>

        {/* Central Tool Switcher */}
        <nav className="navbar-nav-tools">
          <button
            type="button"
            className={`nav-tool-btn ${activeTab === 'plagiarism' ? 'nav-tool-active' : ''}`}
            onClick={() => onSelectTab && onSelectTab('plagiarism')}
          >
            <FileCheck2 size={15} />
            <span>Plagiarism Checker</span>
          </button>

          <button
            type="button"
            className={`nav-tool-btn ${activeTab === 'paraphraser' ? 'nav-tool-active' : ''}`}
            onClick={() => onSelectTab && onSelectTab('paraphraser')}
          >
            <Repeat size={15} />
            <span>Paraphrasing Tool</span>
          </button>

          <button
            type="button"
            className={`nav-tool-btn ${activeTab === 'citations' ? 'nav-tool-active' : ''}`}
            onClick={() => onSelectTab && onSelectTab('citations')}
          >
            <BookOpen size={15} />
            <span>Citation Generator</span>
          </button>

          <button
            type="button"
            className={`nav-tool-btn ${activeTab === 'grammar' ? 'nav-tool-active' : ''}`}
            onClick={() => onSelectTab && onSelectTab('grammar')}
          >
            <CheckCheck size={15} />
            <span>Grammar & Tone</span>
          </button>
        </nav>

        {/* Right side: Verification Status & Actions */}
        <div className="navbar-actions">
          {session?.user ? (
            <div className={`student-badge ${isPaid ? 'badge-pro-glow' : ''}`}>
              {isStudent ? (
                <>
                  <GraduationCap size={15} className="badge-icon text-emerald" />
                  <span className="badge-text">Student Free Pass (Verified)</span>
                </>
              ) : (
                <>
                  <Crown size={15} className="badge-icon text-amber" />
                  <span className="badge-text">Pro Paid Member (Active)</span>
                </>
              )}
              <span className="badge-pulse" />
            </div>
          ) : (
            <div className="student-badge">
              <KeyRound size={14} className="badge-icon" />
              <span className="badge-text">Student ID or Pro Pass Required</span>
            </div>
          )}

          {historyCount > 0 && (
            <button 
              type="button" 
              className="btn-history"
              onClick={onOpenHistory}
              title="Recent Drafts"
            >
              <Sparkles size={15} />
              <span>History ({historyCount})</span>
            </button>
          )}

          {status === 'loading' ? (
            <div className="auth-skeleton" />
          ) : session?.user ? (
            <div className="user-profile">
              <div className="user-avatar-fallback">
                {isStudent ? '🎓' : isPaid ? '👑' : (user?.name?.charAt(0) || 'U')}
              </div>
              <div className="user-details">
                <div className="user-name-line">
                  <span className="user-name">{user?.name || 'User'}</span>
                  {isStudent ? (
                    <span className="pill-student-tiny">Student Free</span>
                  ) : (
                    <span className="pill-standard-tiny">Pro Paid</span>
                  )}
                </div>
                {isStudent && user?.institutionName && (
                  <span className="user-school-tag">
                    {user?.institutionName} • ID: {user?.studentId || 'Verified'}
                  </span>
                )}
                {isPaid && user?.paymentPlan && (
                  <span className="user-school-tag" style={{ color: '#38bdf8' }}>
                    {user?.paymentPlan}
                  </span>
                )}
                <span className="user-email">{user?.email}</span>
              </div>
              <button 
                type="button" 
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="btn-signout"
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <Link 
              href="/login"
              className="btn-email-signin"
            >
              <GraduationCap size={16} />
              <span>Verify Student ID / Pay</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
