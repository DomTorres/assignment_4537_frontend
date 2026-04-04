import { BaseApiService } from './BaseApiService';
import { Question, StudentAnswer, Classroom, ClassroomMembership } from '../models/Classroom';
import { ApiUsageSummary } from '../models/ApiUsage';

/**
 * ClassroomService manages all classroom and AI-powered interactions.
 * Handles question submission, answer evaluation, and usage tracking.
 */
export class ClassroomService extends BaseApiService {
  constructor() {
    super();
  }

  /** Fetch all questions (admin: all users; student: own questions) */
  async getQuestions(classroomId = null) {
    const params = classroomId ? { classroomId } : {};
    const data = await this.get('/questions', params);
    return data.questions.map(Question.fromAPI);
  }

  /**
   * Submit a new question (instructor / admin action).
   * @param {string} text
   * @returns {Promise<Question>}
   */
  async submitQuestion(text, classroomId = null) {
    const body = classroomId ? { text, classroomId } : { text };
    const data = await this.post('/questions', body);
    return Question.fromAPI(data.question);
  }

  /**
   * Submit an answer to a question (student action).
   * @param {string} questionId
   * @param {string} answerText
   * @returns {Promise<StudentAnswer>}
   */
  async submitAnswer(questionId, answerText) {
    const data = await this.post(`/questions/${questionId}/answers`, { text: answerText });
    return StudentAnswer.fromAPI(data.answer);
  }

  /**
   * Request AI evaluation of all answers for a question (admin action).
   * @param {string} questionId
   * @returns {Promise<Question>} - updated question with AI evaluation
   */
  async evaluateAnswers(questionId) {
    const data = await this.post(`/questions/${questionId}/evaluate`);
    return Question.fromAPI(data.question);
  }

  /** Fetch answers for a specific question */
  async getAnswers(questionId) {
    const data = await this.get(`/questions/${questionId}/answers`);
    return data.answers.map(StudentAnswer.fromAPI);
  }

  /**
   * Ask the AI assistant a direct question (uses one API call).
   * @param {string} prompt
   * @returns {Promise<string>} - AI response text
   */
  async askAI(prompt) {
    const data = await this.post('/ai/ask', { prompt });
    return data.response;
  }

  /** Fetch API usage summary for the current user */
  async getUsageSummary() {
    const data = await this.get('/usage');
    return ApiUsageSummary.fromAPI(data);
  }


  /** Fetch all classrooms owned by the current admin */
  async getMyClassrooms() {
    const data = await this.get('/classrooms');
    return data.classrooms.map(Classroom.fromAPI);
  }

  /**
   * Create a new classroom (admin/teacher action).
   * @param {string} name
   * @param {string} description
   * @returns {Promise<Classroom>}
   */
  async createClassroom(name, description = '') {
    const data = await this.post('/classrooms', { name, description });
    return Classroom.fromAPI(data.classroom);
  }

  /**
   * Delete a classroom (admin/teacher action).
   * @param {string} classroomId
   */
  async deleteClassroom(classroomId) {
    return this.delete(`/classrooms/${classroomId}`);
  }

  /**
   * Fetch all questions scoped to a specific classroom.
   * @param {string} classroomId
   * @returns {Promise<Question[]>}
   */
  async getClassroomQuestions(classroomId) {
    const data = await this.get(`/classrooms/${classroomId}/questions`);
    return data.questions.map(Question.fromAPI);
  }

  /**
   * Post a question to a specific classroom (admin/teacher action).
   * @param {string} classroomId
   * @param {string} text
   * @returns {Promise<Question>}
   */
  async submitClassroomQuestion(classroomId, text) {
    const data = await this.post(`/classrooms/${classroomId}/questions`, { text });
    return Question.fromAPI(data.question);
  }


  /** Fetch all classrooms the current student has joined */
  async getMyMemberships() {
    const data = await this.get('/classrooms/memberships');
    return data.memberships.map(ClassroomMembership.fromAPI);
  }

  /**
   * Join a classroom using a join code (student action).
   * @param {string} joinCode
   * @returns {Promise<ClassroomMembership>}
   */
  async joinClassroom(joinCode) {
    const data = await this.post('/classrooms/join', { joinCode });
    return ClassroomMembership.fromAPI(data.membership);
  }

  /**
   * Leave a classroom (student action).
   * @param {string} classroomId
   */
  async leaveClassroom(classroomId) {
    return this.delete(`/classrooms/${classroomId}/leave`);
  }
}

export const classroomService = new ClassroomService();
