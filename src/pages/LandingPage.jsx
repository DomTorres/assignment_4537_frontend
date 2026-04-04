import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * LandingPage — the public-facing home page of Class Host.
 * Redirects authenticated users to their respective dashboard.
 */
export default function LandingPage() {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef(null);

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      navigate(user.isAdmin ? '/admin' : '/dashboard', { replace: true });
    }
  }, [loading, isAuthenticated, user, navigate]);

  // Parallax-lite: shift grid on mouse move
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      hero.style.setProperty('--mx', `${x}px`);
      hero.style.setProperty('--my', `${y}px`);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const features = [
    {
      icon: '⚡',
      title: 'Instant Answer Feedback',
      description: 'Students get feedback on their answers right away, so no one has to wait until the next class to know how they did.',
    },
    {
      icon: '🔒',
      title: 'Safe & Private',
      description: 'Your account and data are protected. Passwords are never stored as plain text and every session is kept secure.',
    },
    {
      icon: '📊',
      title: 'See Who\'s Participating',
      description: 'Instructors can see at a glance who has answered, how the class is doing overall, and where students are struggling.',
    },
    {
      icon: '🤖',
      title: 'Built-in Study Assistant',
      description: 'Students can ask follow-up questions anytime and get helpful, plain-English explanations to keep learning going.',
    },
    {
      icon: '💻',
      title: 'Works on Any Device',
      description: 'Class Host runs entirely in the browser — no app to download, no setup required for students.',
    },
    {
      icon: '🎯',
      title: 'Free to Get Started',
      description: 'Every student gets free AI-assisted feedback included. No credit card, no complicated sign-up process.',
    },
  ];

  return (
    <div className="landing">
      {/* ── Header ── */}
      <header className="landing__header">
        <Link to="/" className="landing__brand">
          <span className="landing__logo-mark">◈</span>
          Class Host
        </Link>
        <nav className="landing__nav">
          <a href="#features" className="landing__nav-link">Features</a>
          <Link to="/login" className="landing__nav-link">Sign In</Link>
          <Link to="/register" className="landing__cta-sm">Get Started</Link>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="landing__hero" ref={heroRef}>
        <div className="landing__grid-bg" />
        <div className="landing__hero-content">
          <div className="landing__eyebrow">AI-Assisted Learning</div>
          <h1 className="landing__headline">
            A better way to<br />
            <span className="landing__headline-accent">run your classroom</span>
          </h1>
          <p className="landing__subline">
            Class Host makes it easy for instructors to ask questions, collect 
            student answers, and get instant feedback — all in one place.
          </p>
          <div className="landing__hero-actions">
            <Link to="/register" className="btn btn--primary btn--lg">
              Get Started Free
            </Link>
            <Link to="/login" className="btn btn--ghost btn--lg">
              Sign In →
            </Link>
          </div>
          <p className="landing__hero-note">Free to use · No credit card needed · Takes 2 minutes to set up</p>
        </div>
        <div className="landing__hero-visual">
          <div className="landing__card-mockup">
            <div className="mockup__header">
              <span className="mockup__dot mockup__dot--red" />
              <span className="mockup__dot mockup__dot--yellow" />
              <span className="mockup__dot mockup__dot--green" />
              <span className="mockup__title">Class Host · Live Session</span>
            </div>
            <div className="mockup__body">
              <div className="mockup__question">
                <span className="mockup__label">Question</span>
                <p>What is the time complexity of binary search?</p>
              </div>
              <div className="mockup__responses">
                <div className="mockup__response mockup__response--correct">
                  <span className="mockup__student">Alice</span>
                  <span className="mockup__answer">O(log n)</span>
                  <span className="mockup__score">✓ 98</span>
                </div>
                <div className="mockup__response mockup__response--partial">
                  <span className="mockup__student">Bob</span>
                  <span className="mockup__answer">O(n log n)</span>
                  <span className="mockup__score">~ 42</span>
                </div>
                <div className="mockup__response mockup__response--typing">
                  <span className="mockup__student">Carol</span>
                  <span className="mockup__typing-dots">
                    <span /><span /><span />
                  </span>
                </div>
              </div>
              <div className="mockup__ai-badge">◈ AI Evaluating…</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing__features" id="features">
        <div className="landing__section-header">
          <h2 className="landing__section-title">Everything in one place</h2>
          <p className="landing__section-sub">Designed to make teaching and learning a little easier every day</p>
        </div>
        <div className="landing__feature-grid">
          {features.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-card__icon">{f.icon}</div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__desc">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing__bottom-cta">
        <h2>Ready to try it with your class?</h2>
        <p>Set up your account in minutes and run your first session today.</p>
        <div className="landing__hero-actions">
          <Link to="/register" className="btn btn--primary btn--lg">Create Free Account</Link>
          <Link to="/login" className="btn btn--outline btn--lg">Sign In</Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing__footer">
        <span className="landing__brand">◈ Class Host</span>
        <span>AI-Assisted Classroom Tool · Term Project</span>
      </footer>
    </div>
  );
}