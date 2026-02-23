import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layouts/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { QuizCard } from '../components/quiz/QuizCard';
import { Quiz, GameSession } from '../types';
import { Plus, LogOut, User, Trash2, PlayCircle, Users, Clock, Eye } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      Promise.all([loadQuizzes(), loadSessions()]).finally(() => setLoading(false));
    }
  }, [currentUser]);

  const loadQuizzes = async () => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, 'quizzes'),
        where('createdBy', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      
      const quizzesData: Quiz[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        quizzesData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Quiz);
      });

      setQuizzes(quizzesData);
    } catch (err) {
      console.error('Error loading quizzes:', err);
      setError('Failed to load quizzes');
    }
  };

  const loadSessions = async () => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, 'gameSessions'),
        where('hostId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);

      const sessionsData: GameSession[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Determine quiz title manually if needed, but quizId is there.
        // We might need to fetch quiz title or store it in session.
        // For now, let's assume session.quiz stores a snapshot of the quiz.
        sessionsData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          players: data.players || []
        } as GameSession);
      });

      // Sort by createdAt desc
      sessionsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setSessions(sessionsData);
    } catch (err) {
      console.error('Error loading sessions:', err);
    }
  };

  const handleCreateQuiz = async () => {
    if (!currentUser) return;

    try {
      const newQuiz: Omit<Quiz, 'id'> = {
        title: 'New Quiz',
        description: '',
        questions: [],
        createdBy: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'quizzes'), {
        ...newQuiz,
        createdAt: Timestamp.fromDate(newQuiz.createdAt),
        updatedAt: Timestamp.fromDate(newQuiz.updatedAt)
      });

      navigate(`/quiz-editor/${docRef.id}`);
    } catch (err) {
      console.error('Error creating quiz:', err);
      setError('Failed to create quiz');
    }
  };

  const handleEditQuiz = (quiz: Quiz) => {
    navigate(`/quiz-editor/${quiz.id}`);
  };

  const handlePlayQuiz = (quiz: Quiz) => {
    navigate(`/host/${quiz.id}`);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await deleteDoc(doc(db, 'quizzes', quizId));
        setQuizzes(prev => prev.filter(quiz => quiz.id !== quizId));
      } catch (err) {
        console.error('Error deleting quiz:', err);
        setError('Failed to delete quiz');
      }
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
      if (window.confirm('Are you sure you want to delete this session? Results will be lost.')) {
          try {
              await deleteDoc(doc(db, 'gameSessions', sessionId));
              setSessions(prev => prev.filter(s => s.id !== sessionId));
          } catch (err) {
              console.error('Error deleting session:', err);
              setError('Failed to delete session');
          }
      }
  };

  const handleViewSession = (session: GameSession) => {
      navigate(`/host/${session.quizId}`, { state: { sessionId: session.id } });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <Layout background="host">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-white text-xl">Loading...</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout background="host">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="mb-4 md:mb-0 text-center md:text-left">
            <h1 className="text-3xl font-bold text-white mb-2">Quiz Dashboard</h1>
            <p className="text-white/70">Create, manage, and host interactive quizzes</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2 text-white/70 mb-4 md:mb-0">
              <User size={20} />
              <span className="truncate max-w-[200px]">{currentUser?.email}</span>
            </div>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut size={20} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Create Quiz Button */}
        <div className="mb-8">
          <Button onClick={handleCreateQuiz} size="lg">
            <Plus size={20} className="mr-2" />
            Create New Quiz
          </Button>
        </div>

        {/* Quizzes Grid */}
        <h2 className="text-2xl font-bold text-white mb-6">Your Quizzes</h2>
        {quizzes.length === 0 ? (
          <Card className="text-center py-12 mb-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-white mb-2">No quizzes yet</h3>
            <p className="text-white/70 mb-6">
              Create your first quiz to get started with hosting interactive games!
            </p>
            <Button onClick={handleCreateQuiz}>
              <Plus size={20} className="mr-2" />
              Create Your First Quiz
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {quizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onPlay={handlePlayQuiz}
                onEdit={handleEditQuiz}
                onDelete={handleDeleteQuiz}
              />
            ))}
          </div>
        )}

        {/* Recent Sessions List */}
        {sessions.length > 0 && (
          <>
            <h2 className="text-2xl font-bold text-white mb-6">Active & Recent Sessions</h2>
            <div className="space-y-4">
              {sessions.map((session) => (
                <Card key={session.id} className="p-4">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{session.quiz?.title || 'Unknown Quiz'}</h3>
                        <span className="bg-blue-600/30 text-blue-200 text-xs px-2 py-1 rounded font-mono">
                          {session.roomCode}
                        </span>
                        {session.mode === 'self-paced' && (
                          <span className="bg-purple-600/30 text-purple-200 text-xs px-2 py-1 rounded">
                            Self-Paced
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded ${
                          session.status === 'finished' ? 'bg-gray-700 text-gray-300' : 'bg-green-600/30 text-green-200'
                        }`}>
                          {session.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{session.createdAt.toLocaleDateString()} {session.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          <span>{session.players?.length || 0} players</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <Button
                        onClick={() => handleViewSession(session)}
                        variant="secondary"
                        className="flex-1 md:flex-none"
                      >
                         <Eye size={16} className="mr-2" />
                         View
                      </Button>
                      <Button
                        onClick={() => handleDeleteSession(session.id)}
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 px-3"
                      >
                         <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};
