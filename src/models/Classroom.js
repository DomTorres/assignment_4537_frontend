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

/**
 * Classroom (Group) model — represents a class a teacher owns
 * and students can join via a join code.
 */
export class Classroom {
  constructor({ id, name, description = '', teacherId, teacherName, joinCode, memberCount = 0, createdAt }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.teacherId = teacherId;
    this.teacherName = teacherName;
    this.joinCode = joinCode;       // short alphanumeric code students use to join
    this.memberCount = memberCount;
    this.createdAt = createdAt ? new Date(createdAt) : new Date();
  }

  get formattedDate() {
    return this.createdAt.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /** Returns a shareable label combining name + code */
  get displayLabel() {
    return `${this.name} (${this.joinCode})`;
  }

  static fromAPI(data) {
    return new Classroom(data);
  }
}

/**
 * ClassroomMembership — tracks which classrooms a student belongs to.
 */
export class ClassroomMembership {
  constructor({ classroomId, classroomName, joinCode, teacherName, joinedAt }) {
    this.classroomId = classroomId;
    this.classroomName = classroomName;
    this.joinCode = joinCode;
    this.teacherName = teacherName;
    this.joinedAt = joinedAt ? new Date(joinedAt) : new Date();
  }

  get formattedDate() {
    return this.joinedAt.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  static fromAPI(data) {
    return new ClassroomMembership(data);
  }
}
