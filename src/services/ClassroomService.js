import { BaseApiService } from './BaseApiService';
import { Question, StudentAnswer } from '../models/Classroom';
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
  async getQuestions() {
    const data = await this.get('/questions');
    return data.questions.map(Question.fromAPI);
  }

  /**
   * Submit a new question (instructor / admin action).
   * @param {string} text
   * @returns {Promise<Question>}
   */
  async submitQuestion(text) {
    const data = await this.post('/questions', { text });
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
}

export const classroomService = new ClassroomService();
