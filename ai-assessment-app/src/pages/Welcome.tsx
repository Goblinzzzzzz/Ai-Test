import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, ArrowRight } from 'lucide-react';
import Card from '../components/Card';
import GradientTop from '../components/GradientTop';
import PrimaryButton from '../components/PrimaryButton';
import BadgeIcon from '../components/BadgeIcon';

interface WelcomeProps {
  onStartAssessment: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onStartAssessment }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card>
        <GradientTop />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center px-6 pb-8 pt-10"
        >
          <div className="flex justify-center mb-6">
            <BadgeIcon>
              <Lightbulb className="w-8 h-8 text-white" />
            </BadgeIcon>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">职场AI效能潜力评估</h1>

          <p className="text-gray-600 mb-2">人工智能时代已经到来，你还在观望，还是已经成为“超级个体”？</p>
          <p className="text-gray-600 mb-6">通过10道题，准确分析你的AI赋能能力，并给出进阶建议。</p>

          <div className="flex justify-center">
            <PrimaryButton onClick={onStartAssessment}>
              开始评估
              <ArrowRight className="ml-2 w-5 h-5" />
            </PrimaryButton>
          </div>

          <p className="text-sm text-gray-500 mt-4">预计耗时2分钟</p>
          <p className="text-xs text-gray-400 mt-2">评分与数据仅用于课程统计</p>
        </motion.div>
      </Card>
    </div>
  );
};

export default Welcome;
