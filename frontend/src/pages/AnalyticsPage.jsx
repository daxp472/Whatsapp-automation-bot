import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Bot, MessageSquare, Zap, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.analytics.getSummary();
      if (res.success) setData(res.data);
    } catch {
      // non-blocking
    } finally {
      setLoading(false);
    }
  };

  const stats = data?.stats || {
    totalInbound: 0,
    totalOutbound: 0,
    aiReplies: 0,
    humanReplies: 0,
    contactsCount: 0,
    replyRate: 100
  };
  const quota = data?.quota || { messageQuota: 100, messagesUsed: 0, remaining: 100 };
  const daily = data?.dailyActivity || [];

  const maxDaily = Math.max(...daily.map(d => d.total), 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Inbound</div>
          <div style={{ fontSize: '28px', fontWeight: '800' }}>{stats.totalInbound}</div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>Customer inquiries</div>
        </div>

        <div className="panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>AI Grounded Replies</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent-teal)' }}>{stats.aiReplies}</div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>{stats.replyRate}% automation rate</div>
        </div>

        <div className="panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Human Handled</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--warning)' }}>{stats.humanReplies}</div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>Operator escalations</div>
        </div>

        <div className="panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Free Quota Used</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent-violet)' }}>{quota.messagesUsed} / {quota.messageQuota}</div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>{quota.remaining} messages remaining</div>
        </div>
      </div>

      {/* 7-Day Activity Chart */}
      <div className="panel" style={{ padding: '24px' }}>
        <div className="panel-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>7-Day Message Activity Trends</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Daily volume of customer questions and bot replies</p>
          </div>
          <div style={{ display: 'flex', gap: '14px', fontSize: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', background: 'var(--accent-teal)', borderRadius: '2px' }} />
              Inbound
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', background: 'var(--accent-violet)', borderRadius: '2px' }} />
              Outbound
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '220px', gap: '12px', paddingTop: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
          {daily.map((day, idx) => {
            const inHeight = Math.max(8, Math.round((day.inbound / maxDaily) * 160));
            const outHeight = Math.max(8, Math.round((day.outbound / maxDaily) * 160));
            return (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
                  <div
                    title={`Inbound: ${day.inbound}`}
                    style={{
                      width: '18px',
                      height: `${inHeight}px`,
                      background: 'var(--accent-teal)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
                    }}
                  />
                  <div
                    title={`Outbound: ${day.outbound}`}
                    style={{
                      width: '18px',
                      height: `${outHeight}px`,
                      background: 'var(--accent-violet)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
                    }}
                  />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px', whiteSpace: 'nowrap' }}>
                  {day.date.split(',')[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
