import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * LandingPage — the public-facing home page of NeuralClass.
 * Redirects authenticated users to their respective dashboard.
 */
export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.isAdmin ? '/admin' : '/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

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
      title: 'Real-Time AI Grading',
      description: 'Student answers are evaluated instantly by our AI model, giving instructors live correctness feedback.',
    },
    {
      icon: '🔐',
      title: 'Secure by Design',
      description: 'JWT-based auth, hashed passwords, XSS & SQL injection protection built in from day one.',
    },
    {
      icon: '📊',
      title: 'Participation Analytics',
      description: 'Track response rates, score distributions, and engagement trends across every session.',
    },
    {
      icon: '🤖',
      title: 'AI Study Assistant',
      description: 'Students can ask the AI follow-up questions to deepen understanding at any time.',
    },
    {
      icon: '🏗',
      title: 'Microservice Architecture',
      description: 'Frontend and API are independently hosted, enabling scalable, resilient deployments.',
    },
    {
      icon: '🎯',
      title: '20 Free API Calls',
      description: 'Every student gets 20 complimentary AI evaluations to get started immediately.',
    },
  ];

  return (
    <div className="landing">
      {/* ── Header ── */}
      <header className="landing__header">
        <Link to="/" className="landing__brand">
          <span className="landing__logo-mark">◈</span>
          NeuralClass
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
          <div className="landing__eyebrow">AI-Powered Classroom</div>
          <h1 className="landing__headline">
            The future of<br />
            <span className="landing__headline-accent">classroom interaction</span>
          </h1>
          <p className="landing__subline">
            NeuralClass brings real-time AI evaluation to every question you ask. 
            Instructors get instant insight. Students get instant feedback.
          </p>
          <div className="landing__hero-actions">
            <Link to="/register" className="btn btn--primary btn--lg">
              Start for Free
            </Link>
            <Link to="/login" className="btn btn--ghost btn--lg">
              Sign In →
            </Link>
          </div>
          <p className="landing__hero-note">20 free AI calls · No credit card required</p>
        </div>
        <div className="landing__hero-visual">
          <div className="landing__card-mockup">
            <div className="mockup__header">
              <span className="mockup__dot mockup__dot--red" />
              <span className="mockup__dot mockup__dot--yellow" />
              <span className="mockup__dot mockup__dot--green" />
              <span className="mockup__title">NeuralClass · Live Session</span>
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
          <h2 className="landing__section-title">Everything you need</h2>
          <p className="landing__section-sub">Built for the modern, AI-augmented classroom</p>
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
        <h2>Ready to transform your classroom?</h2>
        <p>Join NeuralClass and run your first AI-powered session in minutes.</p>
        <div className="landing__hero-actions">
          <Link to="/register" className="btn btn--primary btn--lg">Create Free Account</Link>
          <Link to="/login" className="btn btn--outline btn--lg">Sign In</Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing__footer">
        <span className="landing__brand">◈ NeuralClass</span>
        <span>AI-Powered RESTful API · Term Project</span>
      </footer>
    </div>
  );
}
