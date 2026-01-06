import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
} from 'chart.js';
import { RefreshCw, Share2, BarChart3, Award, TrendingUp, Lightbulb } from 'lucide-react';
import type { AssessmentResult } from '../utils/assessment';
import { submitAssessment } from '../utils/api';
import type { AssessmentSubmission } from '../utils/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale
);

interface ResultProps {
  result: AssessmentResult;
  onRestart: () => void;
  onViewStatistics: () => void;
}

const Result: React.FC<ResultProps> = ({ result, onRestart, onViewStatistics }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Submit result to backend API on component mount
  useEffect(() => {
    submitResult();
  }, []);

  const submitResult = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const submission: AssessmentSubmission = {
        name: '匿名用户', // Could be made configurable in the future
        cohort: 'default',
        total: result.total,
        title: result.title,
        d1: result.dimensions.d1,
        d2: result.dimensions.d2,
        d3: result.dimensions.d3,
        d4: result.dimensions.d4,
        d5: result.dimensions.d5,
        answers: result.answers
      };

      const { ok, error } = await submitAssessment(submission);
      if (ok) {
        setSubmitSuccess(true);
        setSubmitError(null);
      } else {
        setSubmitSuccess(false);
        // User-friendly error messages
        let errorMessage = '提交失败，请稍后重试';
        if (error?.message) {
          if (error.message.includes('验证失败') || error.message.includes('validation')) {
            errorMessage = '数据格式有误，请重新测评';
          } else if (error.message.includes('频繁') || error.message.includes('rate limit')) {
            errorMessage = '提交过于频繁，请稍后再试';
          } else if (error.message.includes('网络') || error.message.includes('network')) {
            errorMessage = '网络连接失败，请检查网络后重试';
          } else {
            errorMessage = `提交失败：${error.message}`;
          }
        }
        setSubmitError(errorMessage);
      }
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      setSubmitError('网络连接失败，请检查您的网络连接后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 移除离线队列逻辑，统一实时保存

  // Radar chart data
  const radarData = {
    labels: [
      'AI卷入度',
      '指令驾驭力',
      '场景覆盖率',
      '创新进化力',
      '技术亲和度'
    ],
    datasets: [
      {
        label: '您的得分',
        data: [
          result.dimensions.d1,
          result.dimensions.d2,
          result.dimensions.d3,
          result.dimensions.d4,
          result.dimensions.d5
        ],
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(139, 92, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(139, 92, 246, 1)',
      },
      {
        label: '满分标准',
        data: [6, 6, 6, 6, 6],
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderColor: 'rgba(99, 102, 241, 0.5)',
        borderWidth: 1,
        pointBackgroundColor: 'rgba(99, 102, 241, 0.5)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(99, 102, 241, 0.5)',
      }
    ]
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '五维能力雷达图',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 6,
        ticks: {
          stepSize: 1
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-4">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              测评完成！
            </h1>
            <p className="text-lg text-gray-600">您的AI效能潜力分析报告</p>
          </motion.div>
        </div>

        {/* Submission Status */}
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-center"
          >
            <p className="text-blue-800">正在保存您的测评结果...</p>
          </motion.div>
        )}

        {submitSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center"
          >
            <p className="text-green-800">✅ 测评结果已成功保存</p>
          </motion.div>
        )}

        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center"
          >
            <p className="text-yellow-800">⚠️ {submitError}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Results Summary */}
          <div className="space-y-6">
            {/* Persona Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {result.title}
                </h2>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  {result.total}/30 分
                </div>
                <p className="text-gray-600">{result.description}</p>
              </div>
            </motion.div>

            {/* Dimension Scores */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                各维度得分
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'AI卷入度', score: result.dimensions.d1, color: 'purple' },
                  { name: '指令驾驭力', score: result.dimensions.d2, color: 'indigo' },
                  { name: '场景覆盖率', score: result.dimensions.d3, color: 'purple' },
                  { name: '创新进化力', score: result.dimensions.d4, color: 'indigo' },
                  { name: '技术亲和度', score: result.dimensions.d5, color: 'purple' }
                ].map((dim) => (
                  <div key={dim.name} className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">{dim.name}</span>
                    <div className="flex items-center">
                      <div className={`w-20 h-2 bg-gray-200 rounded-full mr-2`}>
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r from-${dim.color}-500 to-${dim.color}-600`}
                          style={{ width: `${(dim.score / 6) * 100}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold text-${dim.color}-600`}>
                        {dim.score}/6
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Suggestion */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                发展建议
              </h3>
              <p className="text-gray-700 leading-relaxed">{result.suggestion}</p>
            </motion.div>
          </div>

          {/* Right Column - Radar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="h-96">
              <Radar data={radarData} options={radarOptions} />
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
        >
          <button
            onClick={onRestart}
            className="inline-flex items-center px-6 py-3 bg-white text-purple-600 font-semibold rounded-full border-2 border-purple-200 hover:border-purple-300 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            重新测评
          </button>
          
          <button
            onClick={onViewStatistics}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-full hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            查看群体统计
          </button>
          
          <button
            onClick={() => {
              // Share functionality
              if (navigator.share) {
                navigator.share({
                  title: '我的AI效能潜力测评结果',
                  text: `我在职场AI效能潜力测评中获得了${result.total}/30分，被评为${result.title}！`,
                  url: window.location.href
                });
              } else {
                // Fallback: copy to clipboard
                navigator.clipboard.writeText(`我在职场AI效能潜力测评中获得了${result.total}/30分，被评为${result.title}！`);
                alert('结果已复制到剪贴板');
              }
            }}
            className="inline-flex items-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-full border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Share2 className="w-5 h-5 mr-2" />
            分享结果
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Result;
