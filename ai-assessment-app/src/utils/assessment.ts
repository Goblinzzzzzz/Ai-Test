import { QUESTIONS, DIMENSION_NAMES, PERSONA_TITLES, PERSONA_DESCRIPTIONS, PERSONA_SUGGESTIONS } from './constants';

export interface AssessmentAnswer {
  questionId: number;
  selectedOption: number;
  value: number;
}

export interface DimensionScores {
  d1: number; // AI卷入度
  d2: number; // 指令驾驭力
  d3: number; // 场景覆盖率
  d4: number; // 创新进化力
  d5: number; // 技术亲和度
}

export interface AssessmentResult {
  total: number;
  dimensions: DimensionScores;
  title: string;
  description: string;
  suggestion: string;
  answers: AssessmentAnswer[];
}

// Calculate dimension scores based on answers
export function calculateDimensionScores(answers: AssessmentAnswer[]): DimensionScores {
  const scores: DimensionScores = {
    d1: 0, // AI卷入度 (Q1 + Q2)
    d2: 0, // 指令驾驭力 (Q3 + Q4)
    d3: 0, // 场景覆盖率 (Q5 + Q6)
    d4: 0, // 创新进化力 (Q7 + Q8)
    d5: 0  // 技术亲和度 (Q9 + Q10)
  };

  // Group answers by dimension
  const dimensionAnswers: { [key: number]: AssessmentAnswer[] } = {};
  answers.forEach(answer => {
    const question = QUESTIONS.find(q => q.id === answer.questionId);
    if (question) {
      const dimension = question.dimension;
      if (!dimensionAnswers[dimension]) {
        dimensionAnswers[dimension] = [];
      }
      dimensionAnswers[dimension].push(answer);
    }
  });

  // Calculate scores for each dimension
  Object.keys(scores).forEach((dimKey, index) => {
    const dimension = index + 1;
    const dimAnswers = dimensionAnswers[dimension] || [];
    const totalScore = dimAnswers.reduce((sum, answer) => sum + answer.value, 0);
    scores[dimKey as keyof DimensionScores] = totalScore;
  });

  return scores;
}

// Calculate total score
export function calculateTotalScore(dimensions: DimensionScores): number {
  return Object.values(dimensions).reduce((sum, score) => sum + score, 0);
}

// Determine persona based on total score
export function determinePersona(totalScore: number): {
  title: string;
  description: string;
  suggestion: string;
} {
  let personaKey: string;
  
  if (totalScore <= 8) {
    personaKey = "AI 观望者";
  } else if (totalScore <= 16) {
    personaKey = "效率尝鲜者";
  } else if (totalScore <= 24) {
    personaKey = "流程设计师";
  } else {
    personaKey = "超级个体";
  }

  return {
    title: PERSONA_TITLES[personaKey as keyof typeof PERSONA_TITLES],
    description: PERSONA_DESCRIPTIONS[personaKey as keyof typeof PERSONA_DESCRIPTIONS],
    suggestion: PERSONA_SUGGESTIONS[personaKey as keyof typeof PERSONA_SUGGESTIONS]
  };
}

// Main assessment calculation function
export function calculateAssessmentResult(answers: AssessmentAnswer[]): AssessmentResult {
  const dimensions = calculateDimensionScores(answers);
  const total = calculateTotalScore(dimensions);
  const persona = determinePersona(total);

  return {
    total,
    dimensions,
    title: persona.title,
    description: persona.description,
    suggestion: persona.suggestion,
    answers
  };
}

// Get dimension name
export function getDimensionName(dimension: number): string {
  return DIMENSION_NAMES[dimension as keyof typeof DIMENSION_NAMES] || "未知维度";
}

// Validate answer (check if value is within expected range)
export function validateAnswer(questionId: number, value: number): boolean {
  const question = QUESTIONS.find(q => q.id === questionId);
  if (!question) return false;
  
  const validValues = question.options.map(opt => opt.value);
  return validValues.includes(value);
}

// Get question by ID
export function getQuestion(questionId: number) {
  return QUESTIONS.find(q => q.id === questionId);
}

// Get all questions
export function getAllQuestions() {
  return QUESTIONS;
}