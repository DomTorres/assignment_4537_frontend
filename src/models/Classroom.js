/**
 * Question model representing a question posed by an instructor.
 */
export class Question {
  constructor({ id, text, authorId, authorName, createdAt, status = 'open', aiEvaluation = null }) {
    this.id = id;
    this.text = text;
    this.authorId = authorId;
    this.authorName = authorName;
    this.createdAt = createdAt ? new Date(createdAt) : new Date();
    this.status = status; // 'open' | 'closed' | 'evaluated'
    this.aiEvaluation = aiEvaluation;
  }

  get isOpen() { return this.status === 'open'; }
  get isClosed() { return this.status === 'closed'; }
  get hasEvaluation() { return Boolean(this.aiEvaluation); }

  get formattedDate() {
    return this.createdAt.toLocaleDateString('en-CA', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  static fromAPI(data) {
    return new Question(data);
  }
}

/**
 * StudentAnswer model representing a student's response to a question.
 */
export class StudentAnswer {
  constructor({ id, questionId, studentId, studentName, text, submittedAt, score = null, feedback = null }) {
    this.id = id;
    this.questionId = questionId;
    this.studentId = studentId;
    this.studentName = studentName;
    this.text = text;
    this.submittedAt = submittedAt ? new Date(submittedAt) : new Date();
    this.score = score;         // 0-100 | null (not yet graded)
    this.feedback = feedback;   // AI feedback string | null
  }

  get isGraded() { return this.score !== null; }

  get scoreLabel() {
    if (this.score === null) return 'Pending';
    if (this.score >= 80) return 'Excellent';
    if (this.score >= 60) return 'Good';
    if (this.score >= 40) return 'Needs Work';
    return 'Incorrect';
  }

  get formattedDate() {
    return this.submittedAt.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' });
  }

  static fromAPI(data) {
    return new StudentAnswer(data);
  }
}
