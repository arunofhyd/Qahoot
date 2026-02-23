import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layouts/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { QuestionCard } from '../components/quiz/QuestionCard';
import { Quiz, Question } from '../types';
import { Save, ArrowLeft, Plus, Edit } from 'lucide-react';

export const QuizEditorPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Modal states
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  
  // Question form state
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '']); // Default to two options
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [timeLimit, setTimeLimit] = useState<number | string>(30);
  const [customTimeLimit, setCustomTimeLimit] = useState('');
  const [points, setPoints] = useState(1000);
  // const [mediaUrl, setMediaUrl] = useState(''); // Removed
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (quizId && currentUser) {
      loadQuiz();
    }
  }, [quizId, currentUser]);

  const loadQuiz = async () => {
    if (!quizId || !currentUser) return;

    try {
      setLoading(true);
      const docRef = doc(db, 'quizzes', quizId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.createdBy !== currentUser.uid) {
          setError('You do not have permission to edit this quiz');
          return;
        }

        const quizData: Quiz = {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Quiz;

        setQuiz(quizData);
      } else {
        setError('Quiz not found');
      }
    } catch (err) {
      console.error('Error loading quiz:', err);
      setError('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const saveQuiz = async () => {
    if (!quiz || !quizId) return;

    if (!quiz.title.trim()) {
      setError("Quiz title cannot be empty");
      return;
    }

    try {
      setSaving(true);
      const docRef = doc(db, 'quizzes', quizId);
      await updateDoc(docRef, {
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions,
        settings: quiz.settings || { mode: 'live', enableTiming: false },
        updatedAt: Timestamp.fromDate(new Date())
      });
      navigate('/dashboard'); // Navigate after successful save
    } catch (err) {
      console.error('Error saving quiz:', err);
      setError('Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const openQuestionModal = (question?: Question) => {
    if (question) {
      setEditingQuestion(question);
      setQuestionText(question.text);
      setOptions([...question.options]);
      setCorrectAnswer(question.correctAnswer);
      setPoints(question.points || 1000); // Default to 1000 if points not set
      // setMediaUrl(question.mediaUrl || ''); // Removed

      // Time limit handling
      const predefinedTimeLimits = [10, 15, 20, 30, 45, 60];
      if (predefinedTimeLimits.includes(question.timeLimit)) {
        setTimeLimit(question.timeLimit);
        setCustomTimeLimit('');
      } else {
        setTimeLimit('other');
        setCustomTimeLimit(question.timeLimit.toString());
      }
    } else {
      setEditingQuestion(null);
      setQuestionText('');
      setOptions(['', '']); // Start with two empty options
      setCorrectAnswer(0);
      setTimeLimit(30); // Default for new question
      setCustomTimeLimit('');
      setPoints(1000); // Default for new question
      // setMediaUrl(''); // Removed
    }
    setModalError(''); // Clear modal error when opening
    setShowQuestionModal(true);
  };

  const closeQuestionModal = () => {
    setShowQuestionModal(false);
    setEditingQuestion(null);
    setModalError(''); // Also clear modal error when closing
  };

  const saveQuestion = () => {
    setModalError(''); // Clear previous errors

    if (!questionText.trim()) {
      setModalError('Question text cannot be empty.');
      return;
    }

    if (options.length < 2) {
      setModalError('A question must have at least two answer options.');
      return;
    }

    if (options.some(opt => !opt.trim())) {
      setModalError('Answer options cannot be empty.');
      return;
    }

    let actualTimeLimit: number;
    if (timeLimit === 'other') {
      if (!customTimeLimit.trim() || parseInt(customTimeLimit) <= 0) {
        setModalError('Custom time limit must be a positive number.');
        return;
      }
      actualTimeLimit = parseInt(customTimeLimit);
    } else {
      actualTimeLimit = timeLimit as number;
    }

    if (!quiz) {
        setError('Quiz data is not loaded correctly.');
        return;
    }

    const questionData: Question = {
      id: editingQuestion?.id || `q_${Date.now()}`,
      text: questionText.trim(),
      options: options.map(opt => opt.trim()),
      correctAnswer,
      timeLimit: actualTimeLimit,
      points,
    };

    let updatedQuestions: Question[];
    if (editingQuestion) {
      updatedQuestions = quiz.questions.map(q => 
        q.id === editingQuestion.id ? questionData : q
      );
    } else {
      updatedQuestions = [...quiz.questions, questionData];
    }

    setQuiz({ ...quiz, questions: updatedQuestions });
    closeQuestionModal();
  };

  const deleteQuestion = (questionId: string) => {
    if (!quiz) return;
    const updatedQuestions = quiz.questions.filter(q => q.id !== questionId);
    setQuiz({ ...quiz, questions: updatedQuestions });
  };

  if (loading) {
    return (
      <Layout background="host">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-white text-xl">Loading quiz...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout background="host">
        <div className="container mx-auto px-4 py-8">
          <Card className="text-center">
            <div className="text-red-400 text-xl mb-4">{error}</div>
            <Button onClick={() => navigate('/dashboard')} icon={<ArrowLeft size={20} />}>
              Back to Dashboard
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!quiz) return null;

  return (
    <Layout background="host">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            icon={<ArrowLeft size={20} />}
          >
            Back to Dashboard
          </Button>
          
          <Button onClick={saveQuiz} loading={saving} icon={<Save size={20} />}>
            Save Quiz
          </Button>
        </div>

        {/* Quiz Details */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Quiz Details</h2>
          
          <div className="space-y-4">
            <Input
              label="Quiz Title"
              value={quiz.title}
              onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
              placeholder="Enter quiz title"
            />
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description (Optional)
              </label>
              <textarea
                value={quiz.description}
                onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                placeholder="Enter quiz description"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Quiz Mode
                </label>
                <select
                  value={quiz.settings?.mode || 'live'}
                  onChange={(e) => setQuiz({
                    ...quiz,
                    settings: {
                      ...quiz.settings,
                      mode: e.target.value as 'live' | 'self-paced',
                      enableTiming: quiz.settings?.enableTiming || false
                    }
                  })}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="live">Live Quiz (Synchronous)</option>
                  <option value="self-paced">Self-Paced (Asynchronous)</option>
                </select>
                <p className="text-xs text-white/50 mt-1">
                  Live: Everyone plays together. Self-Paced: Players take it on their own time.
                </p>
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-3 cursor-pointer text-white">
                  <input
                    type="checkbox"
                    checked={quiz.settings?.enableTiming || false}
                    onChange={(e) => setQuiz({
                      ...quiz,
                      settings: {
                        ...quiz.settings,
                        mode: quiz.settings?.mode || 'live',
                        enableTiming: e.target.checked
                      }
                    })}
                    className="w-5 h-5 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium">Record Question Timing</span>
                    <p className="text-xs text-white/50">
                      Track how long players take to answer each question
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Questions Section */}
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              Questions ({quiz.questions.length})
            </h2>
            <Button onClick={() => openQuestionModal()} icon={<Plus size={20} />}>
              Add Question
            </Button>
          </div>

          {quiz.questions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">❓</div>
              <h3 className="text-xl font-semibold text-white mb-2">No questions yet</h3>
              <p className="text-white/70 mb-6">
                Add your first question to get started!
              </p>
              <Button onClick={() => openQuestionModal()} icon={<Plus size={20} />}>
                Add First Question
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {quiz.questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={index}
                  onEdit={openQuestionModal}
                  onDelete={deleteQuestion}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Question Modal */}
        <Modal
          isOpen={showQuestionModal}
          onClose={closeQuestionModal}
          title={editingQuestion ? 'Edit Question' : 'Add New Question'}
          size="lg"
        >
          <div className="space-y-6">
            <Input
              label="Question Text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter your question"
            />

            <div>
              <label className="block text-sm font-medium text-white mb-4">
                Answer Options
              </label>
              <p className="text-sm text-white/60 mb-3">
                Add 2-6 answer options and select the correct one by clicking the radio button.
              </p>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="bg-blue-600/20 rounded-lg px-3 py-2 font-bold text-blue-300 min-w-[40px] text-center border border-blue-500/30">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[index] = e.target.value;
                        setOptions(newOptions);
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      className="flex-1"
                    />
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={correctAnswer === index}
                      onChange={() => setCorrectAnswer(index)}
                      className="w-5 h-5 text-blue-600 cursor-pointer accent-blue-600"
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          const newOptions = options.filter((_, i) => i !== index);
                          // Adjust correctAnswer if the removed option was the correct one or before it
                          if (correctAnswer === index) {
                            setCorrectAnswer(0); // Reset to first option
                          } else if (correctAnswer > index) {
                            setCorrectAnswer(correctAnswer - 1);
                          }
                          setOptions(newOptions);
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOptions([...options, ''])}
                  className="mt-3"
                >
                  Add Option
                </Button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Time Limit (seconds)
              </label>
              <select
                value={timeLimit}
                onChange={(e) => {
                  const value = e.target.value;
                  setTimeLimit(value === "other" ? "other" : Number(value));
                  if (value !== "other") {
                    setCustomTimeLimit(''); // Reset custom time if a predefined is selected
                  }
                }}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value={10}>10 seconds</option>
                <option value={15}>15 seconds</option>
                <option value={20}>20 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={45}>45 seconds</option>
                <option value={60}>60 seconds</option>
                <option value="other">Other (Custom)</option>
              </select>
              {timeLimit === 'other' && (
                <Input
                  type="number"
                  value={customTimeLimit}
                  onChange={(e) => setCustomTimeLimit(e.target.value)}
                  placeholder="Enter custom time limit (seconds)"
                  className="mt-2"
                  min="1"
                />
              )}
            </div>

            {/* Media URL Input Removed */}

            {modalError && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4">
                <p>{modalError}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Points
              </label>
              <Input
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                placeholder="Enter points for the question"
                className="w-full"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={closeQuestionModal}>
                Cancel
              </Button>
              <Button onClick={saveQuestion}>
                {editingQuestion ? 'Update Question' : 'Add Question'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};