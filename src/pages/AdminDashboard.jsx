import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Card, UsageMeter, Alert, Button, Input, Textarea, Badge, Spinner } from '../components/common/UI';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { classroomService } from '../services/ClassroomService';
import { adminService } from '../services/AdminService';
import { Classroom } from '../models/Classroom';

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
 * AnswerReviewPanel — shows all answers for a question and triggers AI evaluation.
 */
function AnswerReviewPanel({ question, answers, onEvaluate }) {
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState('');

  const handleEvaluate = async () => {
    setEvaluating(true);
    setError('');
    try { await onEvaluate(question.id); }
    catch (err) { setError(err.message || 'Evaluation failed.'); }
    finally { setEvaluating(false); }
  };

  return (
    <div className="answer-review">
      <div className="answer-review__header">
        <p className="answer-review__question">{question.text}</p>
        <Button
          variant="accent"
          loading={evaluating}
          onClick={handleEvaluate}
        >
          ◈ AI Evaluate All
        </Button>
      </div>
      {error && <Alert message={error} type="error" />}
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
                <span className={`answer-card__score answer-card__score--${a.score >= 60 ? 'pass' : 'fail'}`}>
                  {a.score}/100 — {a.scoreLabel}
                </span>
              )}
            </div>
            <p className="answer-card__text">{a.text}</p>
            {a.feedback && (
              <div className="answer-card__feedback">
                <span className="answer-card__feedback-label">◈ AI Feedback</span>
                <p>{a.feedback}</p>
              </div>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleEvaluate = async (questionId) => {
    const updated = await classroomService.evaluateAnswers(questionId);
    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
    const answers = await classroomService.getAnswers(questionId);
    setQuestionAnswers(answers);
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
                onEvaluate={handleEvaluate}
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
export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [questions, setQuestions] = useState([]);
  const [users, setUsers] = useState([]);
  const [usageSummaries, setUsageSummaries] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [questionAnswers, setQuestionAnswers] = useState([]);
  const [apiError, setApiError] = useState('');

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

  const handlePostQuestion = async (text) => {
    const q = await classroomService.submitQuestion(text);
    setQuestions((prev) => [q, ...prev]);
  };

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
  };

  const handleResetUsage = async (userId) => {
    const updated = await adminService.resetUserUsage(userId);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
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
              onClick={() => setActiveTab(tab)}
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
                  onClick={() => { setActiveTab('questions'); handleSelectQuestion(q); }}
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
              <h2 className="panel-title">Post New Question</h2>
              <QuestionComposer onPost={handlePostQuestion} />

              <h2 className="panel-title" style={{ marginTop: '2rem' }}>All Questions</h2>
              {qLoading && <Spinner />}
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
                  onEvaluate={handleEvaluate}
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
