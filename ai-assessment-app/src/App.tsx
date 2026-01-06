import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Welcome from './pages/Welcome';
import Assessment from './pages/Assessment';
import Result from './pages/Result';
import Statistics from './pages/Statistics';
import { calculateAssessmentResult } from './utils/assessment';
import type { AssessmentAnswer, AssessmentResult } from './utils/assessment';

type AppState = 'welcome' | 'assessment' | 'result' | 'statistics';

function App() {
  const [currentState, setCurrentState] = useState<AppState>('welcome');
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);

  const handleStartAssessment = () => {
    setCurrentState('assessment');
  };

  const handleAssessmentComplete = (answers: AssessmentAnswer[]) => {
    const result = calculateAssessmentResult(answers);
    setAssessmentResult(result);
    setCurrentState('result');
  };

  const handleRestart = () => {
    setAssessmentResult(null);
    setCurrentState('welcome');
  };

  const handleViewStatistics = () => {
    setCurrentState('statistics');
  };

  const handleBackToWelcome = () => {
    setCurrentState('welcome');
  };

  const renderCurrentState = () => {
    switch (currentState) {
      case 'welcome':
        return (
          <Welcome
            onStartAssessment={handleStartAssessment}
          />
        );
      case 'assessment':
        return (
          <Assessment
            onComplete={handleAssessmentComplete}
            onBack={handleBackToWelcome}
          />
        );
      case 'result':
        return assessmentResult ? (
          <Result
            result={assessmentResult}
            onRestart={handleRestart}
            onViewStatistics={handleViewStatistics}
          />
        ) : null;
      case 'statistics':
        return <Statistics />;
      default:
        return null;
    }
  };

  return (
    <div className="App">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentState}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
        >
          {renderCurrentState()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default App;
