import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, updateDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layouts/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PlayerLobby } from '../components/game/PlayerLobby';
import { QuestionDisplay } from '../components/game/QuestionDisplay';
import { Leaderboard } from '../components/game/Leaderboard';
import { LiveMiniLeaderboard } from '../components/game/LiveMiniLeaderboard'; // Import LiveMiniLeaderboard
import { Quiz, GameSession, Player, LeaderboardEntry } from '../types';
import { 
  Eye,
  Play, 
  SkipForward, 
  Square, 
  ArrowLeft, 
  RefreshCw, 
  Users,
  Trophy 
} from 'lucide-react';

export const HostPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (quizId && currentUser) {
      loadQuiz();
    }
  }, [quizId, currentUser]);

  useEffect(() => {
    if (gameSession?.id) {
      const unsubscribe = onSnapshot(
        doc(db, 'gameSessions', gameSession.id),
        (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            const updatedSession: GameSession = {
              ...data,
              id: doc.id,
              createdAt: data.createdAt?.toDate() || new Date(),
              players: data.players?.map((player: any) => ({
                ...player,
                joinedAt: player.joinedAt?.toDate() || new Date()
              })) || []
            } as GameSession;
            
            setGameSession(updatedSession);
          }
        },
        (err) => {
          console.error('Error listening to game session:', err);
          setError('Connection lost. Please try refreshing.');
        }
      );

      return unsubscribe;
    }
  }, [gameSession?.id]);

  const loadQuiz = async () => {
    if (!quizId || !currentUser) return;

    try {
      setLoading(true);
      const docRef = doc(db, 'quizzes', quizId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.createdBy !== currentUser.uid) {
          setError('You do not have permission to host this quiz');
          return;
        }

        const quizData: Quiz = {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Quiz;

        // Validate quiz has questions
        if (!quizData.questions || quizData.questions.length === 0) {
          setError('This quiz has no questions. Please add questions before hosting.');
          return;
        }

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

  const showAnswer = async () => {
    if (!gameSession) return;
    try {
      await updateDoc(doc(db, 'gameSessions', gameSession.id), {
        status: 'answer_reveal'
      });
    } catch (err) {
      console.error('Error revealing answer:', err);
      // Assuming setError is a state setter like: const [error, setError] = useState('');
      setError('Failed to reveal answer');
    }
  };

  const proceedToLeaderboard = async () => {
    if (!gameSession) return;
    try {
      await updateDoc(doc(db, 'gameSessions', gameSession.id), {
        status: 'leaderboard'
      });
    } catch (err) {
      console.error('Error proceeding to leaderboard:', err);
      setError('Failed to show leaderboard');
    }
  };

  const generateRoomCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const startGame = async () => {
    if (!quiz || !currentUser) return;

    try {
      const roomCode = generateRoomCode();
      
      const newGameSession: Omit<GameSession, 'id'> = {
        roomCode,
        quizId: quiz.id,
        quiz,
        hostId: currentUser.uid,
        status: 'waiting',
        currentQuestionIndex: 0,
        players: [],
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'gameSessions'), {
        ...newGameSession,
        createdAt: Timestamp.fromDate(newGameSession.createdAt)
      });

      setGameSession({ ...newGameSession, id: docRef.id });
    } catch (err) {
      console.error('Error starting game:', err);
      setError('Failed to start game');
    }
  };

  const startQuiz = async () => {
    if (!gameSession) return;

    try {
      await updateDoc(doc(db, 'gameSessions', gameSession.id), {
        status: 'question',
        questionStartTime: Date.now()
      });
    } catch (err) {
      console.error('Error starting quiz:', err);
      setError('Failed to start quiz');
    }
  };

  const nextQuestion = async () => {
    // This function is now called when status is 'leaderboard'
    if (!gameSession || gameSession.status !== 'leaderboard') {
      return;
    }

    const nextIndex = gameSession.currentQuestionIndex + 1;
    try {
      if (nextIndex >= gameSession.quiz.questions.length) {
        await updateDoc(doc(db, 'gameSessions', gameSession.id), {
          status: 'finished'
        });
      } else {
        await updateDoc(doc(db, 'gameSessions', gameSession.id), {
          status: 'question',
          currentQuestionIndex: nextIndex,
          questionStartTime: Date.now()
        });
      }
    } catch (err) {
      console.error('Error moving to next question:', err);
      setError('Failed to move to next question');
    }
  };

  const skipQuestion = async () => {
    if (!gameSession) return;

    const nextIndex = gameSession.currentQuestionIndex + 1;
    
    if (nextIndex >= gameSession.quiz.questions.length) {
      await updateDoc(doc(db, 'gameSessions', gameSession.id), {
        status: 'finished'
      });
    } else {
      // If current status is answer_reveal, skip to next question directly
      // Otherwise (i.e. 'question'), also skip to next question directly
      await updateDoc(doc(db, 'gameSessions', gameSession.id), {
        status: 'question',
        currentQuestionIndex: nextIndex,
        questionStartTime: Date.now()
      });
    }
  };

  const endGame = async () => {
    if (!gameSession) return;

    if (window.confirm('Are you sure you want to end the game?')) {
      try {
        await updateDoc(doc(db, 'gameSessions', gameSession.id), {
          status: 'finished'
        });
      } catch (err) {
        console.error('Error ending game:', err);
        setError('Failed to end game');
      }
    }
  };

  const handleKickPlayer = async (playerId: string) => {
    if (!gameSession) return;

    if (window.confirm('Are you sure you want to kick this player?')) {
      try {
        const updatedPlayers = gameSession.players.filter(p => p.id !== playerId);
        await updateDoc(doc(db, 'gameSessions', gameSession.id), {
          players: updatedPlayers
        });
      } catch (err) {
        console.error('Error kicking player:', err);
        setError('Failed to kick player');
      }
    }
  };

  const generateLeaderboard = (): LeaderboardEntry[] => {
    if (!gameSession) return [];

    const entries = gameSession.players
      .map((player) => ({
        playerId: player.id,
        nickname: player.nickname,
        score: player.score,
        rank: 0,
        lastQuestionPoints: player.answers.length > 0 
          ? player.answers[player.answers.length - 1]?.points 
          : undefined
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return entries;
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
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={20} className="mr-2" />
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
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{quiz.title}</h1>
            <p className="text-white/70">
              {gameSession ? `Room: ${gameSession.roomCode}` : 'Host Dashboard'}
            </p>
          </div>
          
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {error && (
          <Card className="mb-6">
            <div className="flex items-center gap-3 text-red-400">
              <div className="text-2xl">⚠️</div>
              <div>
                <div className="font-semibold">Error</div>
                <div className="text-sm text-red-300">{error}</div>
              </div>
            </div>
          </Card>
        )}

        {/* Game Status */}
        {!gameSession ? (
          <Card className="text-center">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">Ready to Host?</h2>
              <p className="text-white/70 mb-6">
                Start a new game session for "{quiz.title}"
              </p>
              <div className="text-sm text-white/60 mb-6">
                {quiz.questions.length} questions • {' '}
                {Math.round(quiz.questions.reduce((acc, q) => acc + q.timeLimit, 0) / 60)} minutes
              </div>
            </div>
            
            <Button onClick={startGame} size="lg">
              <Play size={20} className="mr-2" />
              Start New Game
            </Button>
          </Card>
        ) : gameSession.status === 'waiting' ? (
          <div className="space-y-6">
            <PlayerLobby
              players={gameSession.players}
              roomCode={gameSession.roomCode}
              isHost={true}
              gameStatus={gameSession.status}
              onKickPlayer={handleKickPlayer}
            />
            
            <Card className="text-center">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">Ready to start?</h3>
                <p className="text-white/70 text-sm">
                  {gameSession.players.length === 0 
                    ? 'Waiting for players to join...' 
                    : `${gameSession.players.length} player${gameSession.players.length !== 1 ? 's' : ''} ready to play!`
                  }
                </p>
              </div>
              <Button
                onClick={startQuiz}
                size="lg"
                disabled={gameSession.players.length === 0}
                className={gameSession.players.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
              >
                <Play size={20} className="mr-2" />
                {gameSession.players.length === 0 ? 'Waiting for Players' : 'Start Quiz'}
              </Button>
            </Card>
          </div>
        ) : gameSession.status === 'question' || gameSession.status === 'answer_reveal' ? (
          <div className="space-y-6">
            <QuestionDisplay
              question={gameSession.quiz.questions[gameSession.currentQuestionIndex]}
              questionNumber={gameSession.currentQuestionIndex + 1}
              totalQuestions={gameSession.quiz.questions.length}
              timeLimit={gameSession.quiz.questions[gameSession.currentQuestionIndex].timeLimit}
              showResults={gameSession.status === 'answer_reveal'}
              isHost={true}
            />
            <Card>
              <div className="flex flex-wrap justify-center gap-4">
                {gameSession.status === 'question' && (
                  <Button onClick={showAnswer} icon={<Eye size={20} className="mr-2" />}>Show Answer</Button>
                )}
                {gameSession.status === 'answer_reveal' && (
                  <Button onClick={proceedToLeaderboard} icon={<Trophy size={20} className="mr-2" />}>Show Leaderboard</Button>
                )}
                {/* Common buttons for both question and answer_reveal states */}
                <Button variant="ghost" onClick={skipQuestion} icon={<SkipForward size={20} className="mr-2" />}>
                  {gameSession.status === 'answer_reveal' ? 'Skip to Next Q' : 'Skip Question'}
                </Button>
                <Button variant="danger" onClick={endGame} icon={<Square size={20} className="mr-2" />}>End Game</Button>
              </div>
            </Card>
            {/* Render LiveMiniLeaderboard during answer_reveal state for Host */}
            {gameSession.status === 'answer_reveal' && gameSession.players && gameSession.players.length > 0 && (
              <LiveMiniLeaderboard players={gameSession.players} />
            )}
          </div>
        ) : gameSession.status === 'leaderboard' ? (
          <div className="space-y-6">
            <Leaderboard
              entries={generateLeaderboard()}
              title={`Question ${gameSession.currentQuestionIndex + 1} Results`}
              showLastQuestionPoints={true}
            />
            <Card>
              <div className="flex flex-wrap justify-center gap-4">
                {gameSession.currentQuestionIndex + 1 < gameSession.quiz.questions.length ? (
                  <Button onClick={nextQuestion} icon={<Play size={20} className="mr-2" />}>
                    Next Question
                  </Button>
                ) : (
                  <Button onClick={nextQuestion} icon={<Trophy size={20} className="mr-2" />}>
                    Final Results
                  </Button>
                )}
                <Button variant="danger" onClick={endGame} icon={<Square size={20} className="mr-2" />}>
                  End Game
                </Button>
              </div>
            </Card>
          </div>
        ) : gameSession.status === 'finished' ? (
          <div className="space-y-6">
            <Leaderboard
              entries={generateLeaderboard()}
              title="Final Results 🏆"
            />
            
            <Card className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Game Complete!</h3>
              <p className="text-white/70 mb-6">
                Thanks for playing "{quiz.title}"
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={startGame}>
                  <RefreshCw size={20} className="mr-2" />
                  Play Again
                </Button>
                <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                  <ArrowLeft size={20} className="mr-2" />
                  Dashboard
                </Button>
              </div>
            </Card>
          </div>
        ) : null}

        {/* Player Count Indicator */}
        {gameSession && (
          <div className="fixed bottom-6 right-6 z-40">
            <Card className="px-4 py-2 shadow-lg">
              <div className="flex items-center gap-2 text-white">
                <Users size={16} />
                <span className="font-semibold">{gameSession.players.length} player{gameSession.players.length !== 1 ? 's' : ''}</span>
                <div className={`w-2 h-2 rounded-full ${gameSession.status === 'waiting' ? 'bg-yellow-400' : 'bg-green-400'}`} />
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};