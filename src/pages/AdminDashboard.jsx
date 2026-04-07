import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Card, Alert, Button, Input, Textarea, Badge, Spinner } from '../components/common/UI';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { classroomService } from '../services/ClassroomService';
import { adminService } from '../services/AdminService';

// ─── Sub-components ──────────────────────────────────────────────────────────

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
 * UserRow — a single row in the admin users table.
 */
function UserRow({ user, usage, onReset }) {
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try { await onReset(user.id); } finally { setResetting(false); }
  };

  const pct = Math.min(100, ((usage?.used ?? 0) / (usage?.limit ?? 20)) * 100);
  const level = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'ok';

  return (
    <tr className="users-table__row">
      <td className="users-table__cell">
        <div className="users-table__name">{user.name}</div>
        <div className="users-table__email">{user.email}</div>
      </td>
      <td className="users-table__cell">
        <Badge variant={user.isAdmin ? 'admin' : 'student'}>
          {user.isAdmin ? 'Admin' : 'Student'}
        </Badge>
      </td>
      <td className="users-table__cell">
        <div className="users-table__usage">
          <div className="users-table__usage-track">
            <div
              className={`users-table__usage-fill users-table__usage-fill--${level}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`users-table__usage-label users-table__usage-label--${level}`}>
            {usage?.used ?? 0} / {usage?.limit ?? 20}
          </span>
        </div>
      </td>
      <td className="users-table__cell">
        <span className="users-table__joined">
          {user.createdAt?.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </td>
      <td className="users-table__cell">
        <Button
          variant="ghost"
          loading={resetting}
          onClick={handleReset}
          className="users-table__reset-btn"
        >
          Reset Calls
        </Button>
      </td>
    </tr>
  );
}

/**
 * QuestionComposer — lets admin post a new question to the class.
 */
function QuestionComposer({ onPost }) {
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePost = async () => {
    if (!text.trim()) { setError('Question cannot be empty.'); return; }
    setPosting(true);
    setError('');
    try {
      await onPost(text.trim());
      setText('');
      setSuccess('Question posted to the class!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to post question.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="question-composer">
      <Textarea
        id="new-question"
        label="Post a question to the class"
        placeholder="e.g. What is the time complexity of binary search?"
        value={text}
        onChange={(e) => { setText(e.target.value); setError(''); }}
        rows={3}
      />
      {error && <span className="field__error">{error}</span>}
      {success && <Alert message={success} type="success" />}
      <Button variant="primary" loading={posting} onClick={handlePost}>
        ◈ Post Question
      </Button>
    </div>
  );
}

/**
 * ClassSummaryPanel — shows aggregate AI analysis of all answers for a question.
 */
function ClassSummaryPanel({ question, answers, analysis, onAnalyze, onEvaluate }) {
  const [evaluating, setEvaluating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const gradedAnswers = answers.filter((a) => a.isGraded);
  const correctCount = gradedAnswers.filter((a) => a.correct).length;
  const incorrectCount = gradedAnswers.filter((a) => !a.correct).length;

  const handleEvaluate = async () => {
    setEvaluating(true);
    setError('');
    try { await onEvaluate(question.id); }
    catch (err) { setError(err.message || 'Evaluation failed.'); }
    finally { setEvaluating(false); }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError('');
    try { await onAnalyze(question.id, answers); }
    catch (err) { setError(err.message || 'Analysis failed.'); }
    finally { setAnalyzing(false); }
  };

  return (
    <div className="class-summary-panel">
      <div className="class-summary-panel__header">
        <h3 className="class-summary-panel__title">Class Summary</h3>
        <div className="class-summary-panel__actions">
          {!question.isClosed && (
            <Button variant="accent" loading={evaluating} onClick={handleEvaluate}>
              ◈ AI Evaluate All
            </Button>
          )}
          {answers.length > 0 && (
            <Button variant="primary" loading={analyzing} onClick={handleAnalyze}>
              ◈ {analysis ? 'Refresh' : 'Generate'} Combined Analysis
            </Button>
          )}
        </div>
      </div>

      {error && <Alert message={error} type="error" />}

      {/* Grade counts — shown once any grading exists */}
      {gradedAnswers.length > 0 && (
        <div className="eval-summary__scores">
          <div className="eval-summary__score eval-summary__score--pass">
            <span className="eval-summary__count">{correctCount}</span>
            <span className="eval-summary__label">Correct</span>
          </div>
          <div className="eval-summary__score eval-summary__score--fail">
            <span className="eval-summary__count">{incorrectCount}</span>
            <span className="eval-summary__label">Incorrect</span>
          </div>
          {analysis && (
            <>
              <div className="eval-summary__score eval-summary__score--neutral">
                <span className="eval-summary__count">{analysis.overallUnderstanding}%</span>
                <span className="eval-summary__label">Comprehension</span>
              </div>
              <div className="eval-summary__score eval-summary__score--warn">
                <span className="eval-summary__count">{analysis.confused?.count ?? 0}</span>
                <span className="eval-summary__label">Confused</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* AI-generated combined summary */}
      {analysis ? (
        <div className="class-summary-panel__body">
          {analysis.summary && (
            <p className="eval-summary__text">{analysis.summary}</p>
          )}

          {analysis.themes?.length > 0 && (
            <div className="eval-summary__section">
              <p className="eval-summary__section-title">Common Themes</p>
              <ul className="eval-summary__list">
                {analysis.themes.map((t, i) => (
                  <li key={i} className="eval-summary__list-item">
                    <span className="eval-summary__list-label">{t.theme}</span>
                    <span className="eval-summary__list-meta">
                      {t.count} student{t.count !== 1 ? 's' : ''} · {t.percentage}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.misconceptions?.length > 0 && (
            <div className="eval-summary__section">
              <p className="eval-summary__section-title eval-summary__section-title--warn">
                Misconceptions
              </p>
              <ul className="eval-summary__list">
                {analysis.misconceptions.map((m, i) => (
                  <li key={i} className="eval-summary__list-item">
                    <span className="eval-summary__list-label">{m.misconception}</span>
                    <span className="eval-summary__list-meta">
                      {m.count} student{m.count !== 1 ? 's' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        answers.length > 0 && (
          <p className="class-summary-panel__hint">
            Click "Generate Combined Analysis" to see an AI-generated summary of all responses.
          </p>
        )
      )}

      {answers.length === 0 && (
        <div className="dashboard-empty">No answers submitted yet.</div>
      )}
    </div>
  );
}

/**
 * AnswerReviewPanel — shows all answers for a question and triggers AI evaluation.
 */
function AnswerReviewPanel({ question, answers, analysis, onEvaluate, onAnalyze }) {
  return (
    <div className="answer-review">
      <p className="answer-review__question">{question.text}</p>

      <ClassSummaryPanel
        question={question}
        answers={answers}
        analysis={analysis}
        onEvaluate={onEvaluate}
        onAnalyze={onAnalyze}
      />

      <h4 className="answer-review__list-title">
        Individual Responses ({answers.length})
      </h4>

      {answers.length === 0 && (
        <div className="dashboard-empty">No answers submitted yet.</div>
      )}
      <div className="answer-review__list">
        {answers.map((a) => (
          <div key={a.id} className={`answer-card ${a.isGraded ? 'answer-card--graded' : ''}`}>
            <div className="answer-card__meta">
              <span className="answer-card__student">{a.studentName}</span>
              <span className="answer-card__time">{a.formattedDate}</span>
              {a.isGraded && (
                <span className={`answer-card__score answer-card__score--${a.correct ? 'pass' : 'fail'}`}>
                  {a.correct ? '✓ Correct' : '✗ Incorrect'}
                </span>
              )}
            </div>
            <p className="answer-card__text">{a.text}</p>
            {a.isGraded && a.feedback && (
              <p className="answer-card__feedback">{a.feedback}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ClassroomManager ────────────────────────────────────────────────────────

/**
 * CreateClassroomForm — inline form for creating a new classroom.
 */
function CreateClassroomForm({ onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) { setError('Classroom name is required.'); return; }
    setLoading(true);
    setError('');
    try {
      await onCreate(name.trim(), description.trim());
      setName('');
      setDescription('');
    } catch (err) {
      setError(err.message || 'Failed to create classroom.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="classroom-create-form">
      <p className="classroom-create-form__title">➕ Create New Classroom</p>
      <div className="classroom-create-form__row">
        <Input
          label="Classroom name"
          id="classroom-name"
          placeholder="e.g. COMP 4537 — Fall 2025"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
        />
        <Input
          label="Description (optional)"
          id="classroom-desc"
          placeholder="Short description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button variant="primary" loading={loading} onClick={handleCreate}>
          Create
        </Button>
      </div>
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}

/**
 * ClassroomCard — displays a single classroom with its join code and actions.
 */
function ClassroomCard({ classroom, isSelected, onSelect, onDelete }) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleCopyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(classroom.joinCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${classroom.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try { await onDelete(classroom.id); }
    finally { setDeleting(false); }
  };

  return (
    <Card
      className={`classroom-card ${isSelected ? 'classroom-card--active' : ''}`}
      onClick={() => onSelect(classroom)}
    >
      <div className="classroom-card__header">
        <span className="classroom-card__name">{classroom.name}</span>
        <Badge variant={isSelected ? 'open' : 'default'}>
          {classroom.memberCount} student{classroom.memberCount !== 1 ? 's' : ''}
        </Badge>
      </div>
      {classroom.description && (
        <p className="classroom-card__desc">{classroom.description}</p>
      )}
      <div className="classroom-card__footer">
        <div>
          <div
            className="classroom-card__code"
            onClick={handleCopyCode}
            title="Click to copy join code"
          >
            {classroom.joinCode}
          </div>
          {copied
            ? <span className="copied-tip">✓ Copied!</span>
            : <span className="classroom-card__code-hint">click to copy join code</span>
          }
        </div>
        <Button
          variant="ghost"
          loading={deleting}
          onClick={handleDelete}
          style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', color: 'var(--red)', borderColor: 'var(--red-dim)' }}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}

/**
 * ClassroomManager — full classroom management tab for admins.
 * Teachers create classrooms, post questions to specific ones,
 * and review answers per classroom.
 */
function ClassroomManager() {
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [questionAnswers, setQuestionAnswers] = useState([]);
  // Keyed by question ID so analysis persists when switching between questions
  const [analysisMap, setAnalysisMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const questionAnalysis = analysisMap[selectedQuestion?.id] ?? null;

  useEffect(() => {
    classroomService.getMyClassrooms()
      .then(setClassrooms)
      .catch((e) => {
        // Network error expected when backend isn't connected yet — show message, don't crash
        setError('Could not load classrooms. ' + (e.message || 'Check your connection.'));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSelectClassroom = async (classroom) => {
    setSelectedClassroom(classroom);
    setSelectedQuestion(null);
    setQuestions([]);
    setQuestionAnswers([]);
    try {
      const qs = await classroomService.getClassroomQuestions(classroom.id);
      setQuestions(qs);
    } catch (e) {
      setError('Could not load questions: ' + (e.message || 'Network error'));
    }
  };

  const handleCreateClassroom = async (name, description) => {
    const classroom = await classroomService.createClassroom(name, description);
    setClassrooms((prev) => [classroom, ...prev]);
  };

  const handleDeleteClassroom = async (classroomId) => {
    await classroomService.deleteClassroom(classroomId);
    setClassrooms((prev) => prev.filter((c) => c.id !== classroomId));
    if (selectedClassroom?.id === classroomId) {
      setSelectedClassroom(null);
      setQuestions([]);
    }
  };

  const handlePostQuestion = async (text) => {
    if (!selectedClassroom) return;
    const q = await classroomService.submitClassroomQuestion(selectedClassroom.id, text);
    setQuestions((prev) => [q, ...prev]);
  };

  const handleSelectQuestion = async (question) => {
    setSelectedQuestion(question);
    try {
      const answers = await classroomService.getAnswers(question.id);
      setQuestionAnswers(answers);
    } catch (e) {
      setError(e.message);
    }
  };

  // Poll for new answers every 5 s while a question is selected
  useEffect(() => {
    if (!selectedQuestion) return;

    const id = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      classroomService.getAnswers(selectedQuestion.id)
        .then(setQuestionAnswers)
        .catch(() => {});
    }, 5000);

    return () => clearInterval(id);
  }, [selectedQuestion]);

  const handleEvaluate = async (questionId) => {
    const updated = await classroomService.evaluateAnswers(questionId);
    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
    const answers = await classroomService.getAnswers(questionId);
    setQuestionAnswers(answers);
    try {
      const analysis = await classroomService.analyzeAnswers(updated.text, answers);
      setAnalysisMap((prev) => ({ ...prev, [questionId]: analysis }));
    } catch {
      // Analysis is non-critical — silently skip if it fails
    }
  };

  const handleAnalyze = async (questionId, answers) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;
    const analysis = await classroomService.analyzeAnswers(question.text, answers);
    setAnalysisMap((prev) => ({ ...prev, [questionId]: analysis }));
  };

  return (
    <div>
      {error && <Alert message={error} type="error" onDismiss={() => setError('')} />}

      <CreateClassroomForm onCreate={handleCreateClassroom} />

      {loading && <Spinner />}

      {!loading && classrooms.length === 0 && (
        <div className="dashboard-empty">No classrooms yet. Create one above.</div>
      )}

      <div className="classroom-grid">
        {classrooms.map((c) => (
          <ClassroomCard
            key={c.id}
            classroom={c}
            isSelected={selectedClassroom?.id === c.id}
            onSelect={handleSelectClassroom}
            onDelete={handleDeleteClassroom}
          />
        ))}
      </div>

      {selectedClassroom && (
        <div className="admin-questions-layout" style={{ marginTop: '1.5rem' }}>
          <Card className="admin-questions-left">
            <h2 className="panel-title">
              Questions — {selectedClassroom.name}
            </h2>
            <QuestionComposer onPost={handlePostQuestion} />

            <div className="question-list" style={{ marginTop: '1rem' }}>
              {questions.length === 0 && (
                <div className="dashboard-empty">No questions in this classroom yet.</div>
              )}
              {questions.map((q) => (
                <div
                  key={q.id}
                  className={`question-list-item ${selectedQuestion?.id === q.id ? 'question-list-item--active' : ''}`}
                  onClick={() => handleSelectQuestion(q)}
                >
                  <p className="question-list-item__text">{q.text}</p>
                  <div className="question-list-item__meta">
                    <Badge variant={q.isOpen ? 'open' : 'closed'}>{q.status}</Badge>
                    <span>{q.formattedDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            {selectedQuestion ? (
              <AnswerReviewPanel
                question={selectedQuestion}
                answers={questionAnswers}
                analysis={questionAnalysis}
                onEvaluate={handleEvaluate}
                onAnalyze={handleAnalyze}
              />
            ) : (
              <div className="dashboard-empty">
                Select a question on the left to review its answers.
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── AdminDashboard ──────────────────────────────────────────────────────────

/**
 * AdminDashboard — the main view for administrator users.
 * Tabs: Overview, Manage Questions, Users & Usage.
 */
function adminTabFromPath(pathname) {
  const segment = pathname.split('/admin/')[1]?.split('/')[0];
  return ['overview', 'classrooms', 'questions', 'users'].includes(segment) ? segment : 'overview';
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => adminTabFromPath(location.pathname));
  const [questions, setQuestions] = useState([]);
  const [users, setUsers] = useState([]);
  const [usageSummaries, setUsageSummaries] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [questionAnswers, setQuestionAnswers] = useState([]);
  const [analysisMap, setAnalysisMap] = useState({});
  const [apiError, setApiError] = useState('');

  const questionAnalysis = analysisMap[selectedQuestion?.id] ?? null;

  // Sync tab when URL changes (navbar links)
  useEffect(() => {
    setActiveTab(adminTabFromPath(location.pathname));
  }, [location.pathname]);

  const { execute: fetchQuestions, loading: qLoading } = useApi(
    useCallback(() => classroomService.getQuestions(), [])
  );
  const { execute: fetchUsers, loading: uLoading } = useApi(
    useCallback(() => adminService.getAllUsers(), [])
  );
  const { execute: fetchUsage } = useApi(
    useCallback(() => adminService.getAllUsageSummaries(), [])
  );

  useEffect(() => {
    fetchQuestions().then(setQuestions).catch((e) => setApiError(e.message));
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      Promise.all([fetchUsers(), fetchUsage()])
        .then(([u, s]) => { setUsers(u); setUsageSummaries(s); })
        .catch((e) => setApiError(e.message));
    }
  }, [activeTab]);

  const handleSelectQuestion = async (question) => {
    setSelectedQuestion(question);
    try {
      const answers = await classroomService.getAnswers(question.id);
      setQuestionAnswers(answers);
    } catch (err) {
      setApiError(err.message);
    }
  };

  const handleEvaluate = async (questionId) => {
    const updated = await classroomService.evaluateAnswers(questionId);
    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
    const answers = await classroomService.getAnswers(questionId);
    setQuestionAnswers(answers);
    try {
      const analysis = await classroomService.analyzeAnswers(updated.text, answers);
      setAnalysisMap((prev) => ({ ...prev, [questionId]: analysis }));
    } catch {
      // Analysis is non-critical — silently skip if it fails
    }
  };

  const handleAnalyze = async (questionId, answers) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;
    const analysis = await classroomService.analyzeAnswers(question.text, answers);
    setAnalysisMap((prev) => ({ ...prev, [questionId]: analysis }));
  };

  const handleResetUsage = async (userId) => {
    const updated = await adminService.resetUserUsage(userId);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    // Reset usage bar immediately — don't wait for a re-fetch
    setUsageSummaries((prev) =>
      prev.map((s) =>
        s.user.id === userId
          ? { ...s, usage: { ...s.usage, used: 0, records: [] } }
          : s
      )
    );
  };

  const totalStudents = users.filter((u) => !u.isAdmin).length;
  const totalApiCalls = usageSummaries.reduce((sum, s) => sum + (s.usage?.used ?? 0), 0);
  const atLimitCount = usageSummaries.filter((s) => s.usage?.isAtLimit).length;

  return (
    <div className="dashboard-layout">
      <Navbar />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Admin Dashboard</h1>
            <p className="dashboard-sub">Logged in as <strong>{user?.name}</strong> · Administrator</p>
          </div>
        </div>

        {apiError && <Alert message={apiError} type="error" onDismiss={() => setApiError('')} />}

        {/* Tab bar */}
        <div className="tab-bar">
          {['overview', 'classrooms', 'questions', 'users'].map((tab) => (
            <button
              key={tab}
              className={`tab-bar__tab ${activeTab === tab ? 'tab-bar__tab--active' : ''}`}
              onClick={() => navigate(`/admin/${tab}`)}
            >
              {tab === 'overview' && '📊 Overview'}
              {tab === 'classrooms' && '🏫 Classrooms'}
              {tab === 'questions' && '❓ Questions'}
              {tab === 'users' && '👥 Users & Usage'}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="stat-row">
              <StatCard label="Total Questions" value={questions.length} icon="❓" accent="blue" />
              <StatCard label="Total Students" value={totalStudents} icon="🎓" accent="purple" />
              <StatCard label="Total API Calls" value={totalApiCalls} icon="⚡" accent="amber" />
              <StatCard label="At Limit" value={atLimitCount} icon="⚠" accent="red" />
            </div>

            <Card className="dashboard-overview-card">
              <h2 className="panel-title">Recent Questions</h2>
              {qLoading && <Spinner />}
              {questions.slice(0, 5).map((q) => (
                <div
                  key={q.id}
                  className="overview-question-row"
                  onClick={() => { navigate('/admin/questions'); handleSelectQuestion(q); }}
                >
                  <span className="overview-question-row__text">{q.text}</span>
                  <Badge variant={q.isOpen ? 'open' : 'closed'}>{q.status}</Badge>
                </div>
              ))}
              {questions.length === 0 && !qLoading && (
                <div className="dashboard-empty">No questions yet. Post one in the Questions tab.</div>
              )}
            </Card>
          </div>
        )}

        {/* Classrooms tab */}
        {activeTab === 'classrooms' && (
          <ClassroomManager />
        )}

        {/* Questions tab */}
        {activeTab === 'questions' && (
          <div className="admin-questions-layout">
            <Card className="admin-questions-left">
              <h2 className="panel-title">All Questions</h2>
              {qLoading && <Spinner />}
              {!qLoading && questions.length === 0 && (
                <div className="dashboard-empty">No questions yet. Post one from the Classrooms tab.</div>
              )}
              <div className="question-list">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    className={`question-list-item ${selectedQuestion?.id === q.id ? 'question-list-item--active' : ''}`}
                    onClick={() => handleSelectQuestion(q)}
                  >
                    <p className="question-list-item__text">{q.text}</p>
                    <div className="question-list-item__meta">
                      <Badge variant={q.isOpen ? 'open' : 'closed'}>{q.status}</Badge>
                      <span>{q.formattedDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="admin-questions-right">
              {selectedQuestion ? (
                <AnswerReviewPanel
                  question={selectedQuestion}
                  answers={questionAnswers}
                  analysis={questionAnalysis}
                  onEvaluate={handleEvaluate}
                  onAnalyze={handleAnalyze}
                />
              ) : (
                <div className="dashboard-empty">
                  Select a question on the left to review its answers.
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Users tab */}
        {activeTab === 'users' && (
          <Card>
            <h2 className="panel-title">Users & API Usage</h2>
            {uLoading && <Spinner />}
            {users.length > 0 && (
              <div className="users-table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th className="users-table__th">User</th>
                      <th className="users-table__th">Role</th>
                      <th className="users-table__th">API Usage</th>
                      <th className="users-table__th">Joined</th>
                      <th className="users-table__th">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const summary = usageSummaries.find((s) => s.user.id === u.id);
                      return (
                        <UserRow
                          key={u.id}
                          user={u}
                          usage={summary?.usage}
                          onReset={handleResetUsage}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {users.length === 0 && !uLoading && (
              <div className="dashboard-empty">No users found.</div>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
