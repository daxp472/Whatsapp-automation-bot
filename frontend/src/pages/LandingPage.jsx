import React from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Shield,
  Zap,
  Users,
  Check,
  ArrowRight,
  ChevronRight,
  ShoppingBag,
  GraduationCap,
  Activity,
  Utensils,
  Terminal,
  CheckCircle2,
  Lock,
  Layers
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', color: 'var(--text-primary)' }}>
      {/* Top Navbar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(9, 10, 13, 0.9)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px' }}>ReplyPilot</span>
              <span style={{ fontSize: '11px', color: 'var(--emerald-500)', fontWeight: '600' }}>WhatsApp AI</span>
            </div>
          </div>

          {/* Nav links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '28px', fontSize: '13.5px', fontWeight: '500', color: 'var(--text-secondary)' }}>
            <a href="#features" style={{ transition: 'color 0.15s' }}>Features</a>
            <a href="#presets" style={{ transition: 'color 0.15s' }}>Use Cases</a>
            <a href="#how-it-works" style={{ transition: 'color 0.15s' }}>Workflow</a>
            <a href="#pricing" style={{ transition: 'color 0.15s' }}>Free Tier</a>
          </nav>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link to="/login" className="btn btn-ghost btn-sm">
              Sign In
            </Link>
            <Link to="/signup" className="btn btn-primary btn-sm">
              Start Free (100 msgs)
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '70px 24px 50px' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center', marginBottom: '48px' }}>
          {/* Subtle status tag */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '20px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            fontWeight: '500',
            marginBottom: '20px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--emerald-500)' }} />
            <span>Built on Kapso WhatsApp Cloud & Google Gemini 3.8</span>
          </div>

          <h1 style={{
            fontSize: '46px',
            fontWeight: '800',
            lineHeight: '1.18',
            letterSpacing: '-1px',
            marginBottom: '18px',
            color: '#FFFFFF'
          }}>
            WhatsApp automation that answers from facts, not hallucinations.
          </h1>

          <p style={{
            fontSize: '17px',
            lineHeight: '1.6',
            color: 'var(--text-secondary)',
            marginBottom: '30px'
          }}>
            Connect your WhatsApp Business number, save your verified store or clinic FAQs once, and let Gemini draft grounded replies 24/7. Includes instant human takeover whenever a customer needs a real person.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn btn-primary btn-lg">
              Start Testing Free (100 Messages)
              <ArrowRight size={15} />
            </Link>
            <Link to="/simulator" className="btn btn-secondary btn-lg">
              Test in Web Simulator
            </Link>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '24px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={14} color="var(--emerald-500)" /> 100 free test messages/month
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={14} color="var(--emerald-500)" /> Zero credit card required
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={14} color="var(--emerald-500)" /> Instant human handoff keyword
            </span>
          </div>
        </div>

        {/* Hero Product Frame (macOS/Clean window aesthetic) */}
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
        }}>
          {/* Window Chrome */}
          <div style={{
            padding: '10px 16px',
            background: 'var(--bg-sidebar)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
            </div>
            <span style={{ fontSize: '11.5px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
              replypilot.internal / whatsapp / live-session
            </span>
            <span className="badge badge-emerald" style={{ fontSize: '11px' }}>
              Active · Connected
            </span>
          </div>

          {/* Conversation view inside product chrome */}
          <div style={{ padding: '24px', background: '#0B141A', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="chat-bubble-inbound">
              <p>Hi! What are your delivery hours and what is your return policy?</p>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>10:32 AM</div>
            </div>

            <div className="chat-bubble-outbound">
              <div style={{ fontSize: '11px', color: '#34D399', fontWeight: '600', marginBottom: '2px' }}>
                ✓ Grounded Gemini 3.8 Reply
              </div>
              <p>Hello! We deliver Monday through Saturday from 9:00 AM to 7:00 PM. We offer a 7-day hassle-free return window on all unworn items with tags attached!</p>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textAlign: 'right', marginTop: '4px' }}>
                10:32 AM · Delivered ✓✓
              </div>
            </div>

            <div className="chat-bubble-inbound">
              <p>Can I speak with a human support agent please?</p>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>10:33 AM</div>
            </div>

            <div style={{
              alignSelf: 'center',
              padding: '6px 14px',
              borderRadius: '6px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: 'var(--warning)',
              fontSize: '11.5px',
              fontWeight: '500'
            }}>
              👤 Human Takeover Triggered: Automated replies paused for this thread
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section id="features" style={{ maxWidth: '1200px', margin: '60px auto', padding: '0 24px' }}>
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '50px', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px' }}>
            Designed for real business operations
          </h2>
          <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            No visual flowchart spaghetti. Just straightforward business grounding, reliable webhooks, and manual takeover.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
          {[
            {
              icon: Shield,
              title: 'Strict Fact Grounding',
              desc: 'Gemini answers solely based on your saved FAQs and profile. It is instructed never to invent prices, dates, or false promises.'
            },
            {
              icon: Users,
              title: 'Instant Human Takeover',
              desc: 'Customizable keywords ("human", "agent", "support") pause the bot instantly and alert your team in the Inbox.'
            },
            {
              icon: Terminal,
              title: 'Native Kapso Cloud API',
              desc: 'Direct WhatsApp Cloud API webhook receiver and message dispatcher with payload deduplication and status tracking.'
            },
            {
              icon: Zap,
              title: '100 Free Messages / Month',
              desc: 'Every account gets 100 free testing messages every 30 days to test in sandbox or simulator before launch.'
            },
            {
              icon: Layers,
              title: 'One-Click Presets',
              desc: 'Pre-populated bot profiles and knowledge bases for E-commerce, Clinics, Coaching, and Restaurants.'
            },
            {
              icon: Lock,
              title: 'Server-Side Secrets',
              desc: 'Your Gemini and Kapso keys stay in server environment variables. Zero client-side credential exposure.'
            }
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="panel" style={{ padding: '24px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', color: 'var(--emerald-500)' }}>
                  <Icon size={18} />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px' }}>{item.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.55' }}>{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Use Cases */}
      <section id="presets" style={{ maxWidth: '1200px', margin: '50px auto', padding: '0 24px' }}>
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '40px', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Industry Presets</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { icon: ShoppingBag, title: 'E-Commerce / D2C', desc: 'Handles order status, returns, COD policies, and shipping times.' },
            { icon: GraduationCap, title: 'Education / Coaching', desc: 'Answers batch timings, syllabus, fees, and free demo class bookings.' },
            { icon: Activity, title: 'Clinic / Healthcare', desc: 'Manages doctor schedules, OPD timings, and consultation queries.' },
            { icon: Utensils, title: 'Restaurant / Dining', desc: 'Answers menu questions, dietary options, and table reservation requests.' }
          ].map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} className="panel" style={{ padding: '20px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald-500)', marginBottom: '12px' }}>
                  <Icon size={16} />
                </div>
                <h4 style={{ fontSize: '14.5px', fontWeight: '700', marginBottom: '4px' }}>{p.title}</h4>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.45' }}>{p.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Free Plan Pricing Card */}
      <section id="pricing" style={{ maxWidth: '1200px', margin: '60px auto 80px', padding: '0 24px' }}>
        <div style={{
          maxWidth: '520px',
          margin: '0 auto',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          padding: '36px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Testing Tier</span>
            <span className="badge badge-emerald">Free Forever</span>
          </div>

          <div style={{ fontSize: '38px', fontWeight: '800', margin: '10px 0' }}>
            $0 <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--text-muted)' }}>/ month</span>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '22px' }}>
            Everything needed to test in simulator and connect live Kapso sandbox.
          </p>

          <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginBottom: '28px', listStyle: 'none' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={15} color="var(--emerald-500)" />
              <span><b>100 free messages</b> renewed every 30 days</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={15} color="var(--emerald-500)" />
              <span>Full Demo Web Simulator access</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={15} color="var(--emerald-500)" />
              <span>Google Gemini 3.8 Flash live integration</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={15} color="var(--emerald-500)" />
              <span>Kapso WhatsApp Cloud Webhook receiver</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={15} color="var(--emerald-500)" />
              <span>One-click human takeover & manual reply composer</span>
            </li>
          </ul>

          <Link to="/signup" className="btn btn-primary" style={{ width: '100%', padding: '10px 0' }}>
            Create Account & Get 100 Free Msgs
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '30px 24px', background: 'var(--bg-sidebar)', textAlign: 'center', fontSize: '12.5px', color: 'var(--text-muted)' }}>
        <p>© 2026 ReplyPilot. Grounded WhatsApp assistant built with Kapso & Google Gemini 3.8.</p>
      </footer>
    </div>
  );
}
