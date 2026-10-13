import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  MessageSquareCode,
  Users,
  Cpu,
  HelpCircle,
  FileText,
  BarChart3,
  Plug,
  Settings,
  BookOpenCheck,
  Zap,
  LogOut,
  MessageSquare,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ onOpenGuide }) {
  const { user, workspace, quota, logout } = useAuth();

  const navItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Inbox', to: '/inbox', icon: Inbox },
    { label: 'Human Review', to: '/handover', icon: UserCheck },
    { label: 'Demo Simulator', to: '/simulator', icon: MessageSquareCode, badge: 'TEST' },
    { label: 'Contacts & Leads', to: '/contacts', icon: Users },
    { label: 'Knowledge Base', to: '/faqs', icon: HelpCircle },
    { label: 'Automations', to: '/automations', icon: Cpu },
    { label: 'Reply Templates', to: '/templates', icon: FileText },
    { label: 'Analytics', to: '/analytics', icon: BarChart3 },
    { label: 'Integrations', to: '/integrations', icon: Plug },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  const quotaPercent = Math.min(100, Math.round(((quota?.messagesUsed || 0) / (quota?.messageQuota || 100)) * 100));

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'var(--emerald-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF'
        }}>
          <MessageSquare size={17} />
        </div>
        <div>
          <div style={{ fontWeight: '700', fontSize: '15px', letterSpacing: '-0.2px', color: 'var(--text-primary)' }}>
            ReplyPilot
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            WhatsApp AI Engine
          </div>
        </div>
      </div>

      {/* Workspace Indicator */}
      <div style={{ padding: '10px 20px', background: 'rgba(255, 255, 255, 0.015)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          Workspace
        </div>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {workspace?.name || 'My Business'}
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '12px 10px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '7px',
                fontSize: '13px',
                fontWeight: isActive ? '600' : '500',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--emerald-500)' : '2px solid transparent',
                transition: 'all 0.1s ease'
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={16} color="inherit" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: '700',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--emerald-500)'
                }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        <button
          onClick={onOpenGuide}
          style={{
            marginTop: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 12px',
            borderRadius: '7px',
            fontSize: '12.5px',
            fontWeight: '500',
            color: 'var(--text-secondary)',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <BookOpenCheck size={15} color="var(--emerald-500)" />
          <span>Setup & Testing Guide</span>
        </button>
      </nav>

      {/* Free Plan / Quota Tracker Card */}
      <div style={{
        margin: '10px',
        padding: '12px 14px',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
            <Zap size={13} color="var(--emerald-500)" />
            <span>Free Test Plan</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--emerald-500)', fontWeight: '600' }}>
            {quota?.remaining ?? 100} left
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', height: '5px', background: 'var(--bg-canvas)', borderRadius: '3px', overflow: 'hidden', margin: '6px 0' }}>
          <div style={{
            width: `${quotaPercent}%`,
            height: '100%',
            background: quotaPercent > 90 ? 'var(--danger)' : 'var(--emerald-500)',
            transition: 'width 0.3s ease'
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)' }}>
          <span>{quota?.messagesUsed || 0} / {quota?.messageQuota || 100} msgs</span>
          <span>30-Day Cycle</span>
        </div>
      </div>

      {/* User profile & Logout */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: '600',
            color: 'var(--emerald-500)'
          }}>
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'Demo User'}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email || 'demo@replypilot.com'}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}
