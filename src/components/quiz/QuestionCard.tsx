import React from 'react';
import { Question } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Edit, Trash2, Clock, Award } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  index: number;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  onEdit,
  onDelete
}) => {
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      onDelete(question.id);
    }
  };

  return (
    <Card className="mb-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-600 text-white px-2 py-1 rounded-lg text-sm font-medium">
              Q{index + 1}
            </span>
            {question.type === 'text' && (
              <span className="bg-purple-600/50 text-purple-200 px-2 py-1 rounded-lg text-sm font-medium border border-purple-500/30">
                Fill-in
              </span>
            )}
            <div className="flex items-center gap-1 text-white/60 text-sm">
              <Clock size={14} />
              <span>{question.timeLimit}s</span>
            </div>
            <div className="flex items-center gap-1 text-white/60 text-sm">
              <Award size={14} />
              <span>{question.points} points</span>
            </div>
          </div>
          <h4 className="text-white font-medium mb-3">{question.text}</h4>
          
          {question.type === 'text' ? (
            <div className="p-3 rounded-lg border bg-green-500/20 border-green-500/40 text-green-300">
              <span className="font-medium mr-2">Answer:</span>
              {question.correctAnswer}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {question.options?.map((option, optionIndex) => (
                <div
                  key={optionIndex}
                  className={`p-3 rounded-lg border ${
                    optionIndex === question.correctAnswer
                      ? 'bg-green-500/20 border-green-500/40 text-green-300'
                      : 'bg-white/5 border-white/20 text-white/70'
                  }`}
                >
                  <span className="font-medium mr-2">
                    {String.fromCharCode(65 + optionIndex)}.
                  </span>
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-2 ml-4">
          <Button
            variant="ghost"
            onClick={() => onEdit(question)}
            className="px-3 py-2"
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="ghost"
            onClick={handleDelete}
            className="px-3 py-2 text-red-400 hover:text-red-300"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
};