import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { QUESTIONS, DIMENSION_NAMES } from '../utils/constants';
import type { AssessmentAnswer } from '../utils/assessment';

interface AssessmentProps {
  onComplete: (answers: AssessmentAnswer[]) => void;
  onBack: () => void;
}

const Assessment: React.FC<AssessmentProps> = ({ onComplete, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const currentQ = QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  const handleOptionSelect = (optionIndex: number, value: number) => {
    setSelectedOption(optionIndex);
    
    const newAnswer: AssessmentAnswer = {
      questionId: currentQ.id,
      selectedOption: optionIndex,
      value: value
    };

    // Update or add answer
    const updatedAnswers = answers.filter(a => a.questionId !== currentQ.id);
    updatedAnswers.push(newAnswer);
    setAnswers(updatedAnswers);
  };

  const handleNext = () => {
    if (selectedOption === null) return;
    
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
    } else {
      // Assessment complete
      onComplete(answers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      // Restore previous answer if exists
      const prevAnswer = answers.find(a => a.questionId === QUESTIONS[currentQuestion - 1].id);
      setSelectedOption(prevAnswer?.selectedOption ?? null);
    }
  };

  // Check if current question has been answered
  const currentAnswer = answers.find(a => a.questionId === currentQ.id);
  const canProceed = selectedOption !== null || currentAnswer !== undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            返回首页
          </button>
          
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            职场AI效能潜力测评
          </h1>
          <p className="text-gray-600">请根据您的实际情况选择最符合的选项</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              问题 {currentQuestion + 1} / {QUESTIONS.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% 完成
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div 
              className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8"
          >
            {/* Dimension Tag */}
            <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
              <BarChart3 className="w-4 h-4 mr-1" />
              {DIMENSION_NAMES[currentQ.dimension as keyof typeof DIMENSION_NAMES]}
            </div>

            {/* Question Text */}
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-6 leading-relaxed">
              {currentQ.text}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {currentQ.options.map((option, index) => {
                const isSelected = selectedOption === index || currentAnswer?.selectedOption === index;
                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOptionSelect(index, option.value)}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 text-purple-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-25'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`w-6 h-6 rounded-full border-2 mr-3 mt-0.5 flex items-center justify-center ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span className="flex-1">{option.text}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className={`inline-flex items-center px-4 py-2 rounded-lg font-medium ${
              currentQuestion === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            上一题
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`inline-flex items-center px-6 py-3 rounded-lg font-medium ${
              canProceed
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {currentQuestion === QUESTIONS.length - 1 ? '完成测评' : '下一题'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Assessment;