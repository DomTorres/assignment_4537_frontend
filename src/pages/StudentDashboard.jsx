import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Card, UsageMeter, Alert, Button, Textarea, Badge } from '../components/common/UI';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { classroomService } from '../services/ClassroomService';
import { Question, StudentAnswer } from '../models/Classroom';

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * StatCard — displays a single metric on the student overview.
 */
function StatCard({ label, value, icon, accent }) {
  return (
    <Card className={`stat-card stat-card--${accent}`}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__body">
        <span className="stat-card__value">{value}</span>
        <span className="stat-card__label">{label}</span>
      </div>
    </Card>
  );
}

/**
 * QuestionItem — renders a single open question with an answer form.
 */
function QuestionItem({ question, onAnswer }) {
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!answer.trim()) { setError('Please write an answer first.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onAnswer(question.id, answer);
      setSubmitted(true);
      setAnswer('');
    } catch (err) {
      setError(err.message || 'Failed to submit answer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="question-item">
      <div className="question-item__meta">
        <span className="question-item__author">{question.authorName}</span>
        <span className="question-item__time">{question.formattedDate}</span>
        <Badge variant={question.isOpen ? 'open' : 'closed'}>
          {question.status}
        </Badge>
      </div>
      <p className="question-item__text">{question.text}</p>

      {submitted ? (
        <div className="question-item__submitted">
          ✓ Answer submitted — awaiting AI evaluation
        </div>
      ) : question.isOpen ? (
        <div className="question-item__answer-form">
          <Textarea
            id={`answer-${question.id}`}
            placeholder="Type your answer here…"
            value={answer}
            onChange={(e) => { setAnswer(e.target.value); setError(''); }}
            rows={3}
          />
          {error && <span className="field__error">{error}</span>}
          <Button
            variant="primary"
            loading={submitting}
            onClick={handleSubmit}
            className="question-item__submit"
          >
            Submit Answer
          </Button>
        </div>
      ) : (
        <div className="question-item__closed">This question is closed.</div>
      )}
    </Card>
  );
}

/**
 * AiChatPanel — lets students ask the AI assistant directly.
 */
function AiChatPanel({ onCallUsed }) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const { execute, loading, error } = useApi(
    useCallback((p) => classroomService.askAI(p), [])
  );

  const handleAsk = async () => {
    if (!prompt.trim()) return;
    const userMsg = { role: 'user', text: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    try {
      const response = await execute(prompt);
      setMessages((prev) => [...prev, { role: 'ai', text: response }]);
      onCallUsed?.();
    } catch {
      setMessages((prev) => [...prev, { role: 'error', text: error || 'AI request failed.' }]);
    }
  };

  return (
    <div className="ai-chat">
      <div className="ai-chat__messages">
        {messages.length === 0 && (
          <div className="ai-chat__empty">
            Ask the AI anything about today's topics…
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`ai-chat__bubble ai-chat__bubble--${m.role}`}>
            {m.role === 'ai' && <span className="ai-chat__ai-icon">◈</span>}
            <p>{m.text}</p>
          </div>
        ))}
        {loading && (
          <div className="ai-chat__bubble ai-chat__bubble--ai">
            <span className="ai-chat__ai-icon">◈</span>
            <div className="ai-chat__thinking">
              <span /><span /><span />
            </div>
          </div>
        )}
      </div>
      <div className="ai-chat__input-row">
        <textarea
          className="field__input field__input--textarea ai-chat__input"
          placeholder="Ask the AI a question…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); }}}
        />
        <Button variant="primary" onClick={handleAsk} loading={loading} disabled={!prompt.trim()}>
          Ask ◈
        </Button>
      </div>
    </div>
  );
}

// ─── StudentDashboard ────────────────────────────────────────────────────────

/**
 * StudentDashboard — the main view for authenticated student users.
 * Shows usage stats, open questions, personal answers, and AI chat.
 */
export default function StudentDashboard() {
  const { user, refreshUser } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'ai'
  const [apiError, setApiError] = useState('');

  const { execute: fetchQuestions, loading: qLoading } = useApi(
    useCallback(() => classroomService.getQuestions(), [])
  );

  useEffect(() => {
    fetchQuestions()
      .then((qs) => setQuestions(qs))
      .catch((err) => setApiError(err.message));
  }, []);

  const handleAnswer = async (questionId, answerText) => {
    await classroomService.submitAnswer(questionId, answerText);
    // Refresh usage after a call is consumed
    const summary = await classroomService.getUsageSummary();
    if (user) {
      refreshUser({ ...user, apiCallsUsed: summary.used });
    }
  };

  const openQuestions = questions.filter((q) => q.isOpen);

  return (
    <div className="dashboard-layout">
      <Navbar />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Student Dashboard</h1>
            <p className="dashboard-sub">Welcome back, <strong>{user?.name}</strong></p>
          </div>
          {user?.isLimitReached && (
            <Alert
              message="⚠ You've reached your 20 free API calls. Contact your instructor to reset."
              type="warning"
            />
          )}
        </div>

        {/* Stats row */}
        <div className="stat-row">
          <StatCard label="Open Questions" value={openQuestions.length} icon="❓" accent="blue" />
          <StatCard label="API Calls Used" value={user?.apiCallsUsed ?? 0} icon="⚡" accent="amber" />
          <StatCard label="Calls Remaining" value={user?.remainingCalls ?? 20} icon="🔋" accent="green" />
          <StatCard label="Your Role" value="Student" icon="🎓" accent="purple" />
        </div>

        {/* Usage meter */}
        <Card className="dashboard-usage">
          <UsageMeter used={user?.apiCallsUsed ?? 0} limit={user?.apiCallsLimit ?? 20} />
        </Card>

        {apiError && <Alert message={apiError} type="error" onDismiss={() => setApiError('')} />}

        {/* Tab bar */}
        <div className="tab-bar">
          <button
            className={`tab-bar__tab ${activeTab === 'questions' ? 'tab-bar__tab--active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            Live Questions <span className="tab-bar__badge">{openQuestions.length}</span>
          </button>
          <button
            className={`tab-bar__tab ${activeTab === 'ai' ? 'tab-bar__tab--active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            ◈ Ask AI
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'questions' && (
          <div className="question-list">
            {qLoading && <div className="dashboard-loading">Loading questions…</div>}
            {!qLoading && openQuestions.length === 0 && (
              <div className="dashboard-empty">
                No open questions right now. Check back during class!
              </div>
            )}
            {openQuestions.map((q) => (
              <QuestionItem key={q.id} question={q} onAnswer={handleAnswer} />
            ))}
          </div>
        )}

        {activeTab === 'ai' && (
          <Card className="dashboard-ai-panel">
            <h2 className="panel-title">◈ AI Study Assistant</h2>
            <p className="panel-sub">Each question uses one of your {user?.remainingCalls} remaining API calls.</p>
            <AiChatPanel onCallUsed={() => {
              if (user) refreshUser({ ...user, apiCallsUsed: (user.apiCallsUsed || 0) + 1 });
            }} />
          </Card>
        )}
      </main>
    </div>
  );
}
