import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { Layout } from '../components/layouts/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PlayerLobby } from '../components/game/PlayerLobby';
import { QuestionDisplay } from '../components/game/QuestionDisplay';
import { Leaderboard } from '../components/game/Leaderboard';
import { LiveMiniLeaderboard } from '../components/game/LiveMiniLeaderboard';
import { LeaderboardEntry } from '../types';
import { ArrowLeft } from 'lucide-react';

export const GamePage: React.FC = () => {
  const { gameSession, currentPlayer, submitAnswer, leaveGame, error } = useGame();
  const navigate = useNavigate();
  const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  const prevStatusRef = useRef<string>();
  const prevQuestionIndexRef = useRef<number>(-1);

  // Determine current question index based on mode
  const isSelfPaced = gameSession?.mode === 'self-paced';
  const currentQuestionIndex = isSelfPaced
    ? (currentPlayer?.answers.length || 0)
    : (gameSession?.currentQuestionIndex || 0);

  useEffect(() => {
    if (gameSession) {
      prevStatusRef.current = gameSession.status;
    }
  }, [gameSession?.status]);

  useEffect(() => {
    if (!gameSession && !currentPlayer) {
      navigate('/');
    }
  }, [gameSession, currentPlayer, navigate]);

  // Reset answer state when question changes
  useEffect(() => {
    if (currentQuestionIndex !== prevQuestionIndexRef.current) {
        setSelectedAnswer(null);
        setHasAnswered(false);
        setQuestionStartTime(Date.now());
        prevQuestionIndexRef.current = currentQuestionIndex;
    }
  }, [currentQuestionIndex]);

  // Auto-timeout for Live Mode
  useEffect(() => {
    if (isSelfPaced) return; // No auto-timeout for self-paced in this logic (handled by client or ignored)

    if (
      gameSession &&
      currentPlayer &&
      prevStatusRef.current === 'question' &&
      gameSession.status === 'answer_reveal' &&
      gameSession.quiz &&
      gameSession.quiz.questions &&
      gameSession.currentQuestionIndex >= 0 &&
      gameSession.currentQuestionIndex < gameSession.quiz.questions.length &&
      !hasAnswered
    ) {
      console.log(`Player ${currentPlayer.id} timed out. Submitting -1.`);
      submitAnswer(-1);
      setHasAnswered(true);
    }
  }, [
    gameSession?.status,
    gameSession?.currentQuestionIndex,
    currentPlayer,
    hasAnswered,
    submitAnswer,
    gameSession,
    isSelfPaced
  ]);

  const handleAnswerSelect = useCallback(async (answer: number | string) => {
    if (hasAnswered || !gameSession) return;

    if (isSelfPaced) {
        if (gameSession.status !== 'active') return;
    } else {
        if (gameSession.status !== 'question') return;
    }

    setHasAnswered(true);
    setSelectedAnswer(answer); // Keep track locally

    const endedAt = Date.now();
    await submitAnswer(answer, questionStartTime, endedAt);

    if (isSelfPaced) {
        // For self-paced, maybe show a "Next" button or just delay?
        // Current implementation of QuestionDisplay doesn't have a "Next" button.
        // We will just let the state update (currentPlayer.answers changes -> currentQuestionIndex changes -> re-render new question)
        // But we need to wait for the submitAnswer to complete and update context.
    }

  }, [hasAnswered, gameSession, submitAnswer, isSelfPaced, questionStartTime]);

  const handleLeaveGame = () => {
    if (window.confirm('Are you sure you want to leave the game?')) {
      leaveGame();
      navigate('/');
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

  if (!gameSession || !currentPlayer) {
    return (
      <Layout background="game">
        <div className="container mx-auto px-4 py-8">
          <Card className="text-center">
            <div className="text-xl text-white mb-4">Loading game...</div>
          </Card>
        </div>
      </Layout>
    );
  }

  // Render logic helper
  const renderContent = () => {
    // 1. Waiting Room
    if (gameSession.status === 'waiting') {
       return (
          <PlayerLobby
            players={gameSession.players}
            roomCode={gameSession.roomCode}
            isHost={false}
          />
       );
    }

    // 2. Self-Paced Mode Logic
    if (isSelfPaced && gameSession.status === 'active') {
       const totalQuestions = gameSession.quiz.questions.length;
       if (currentQuestionIndex >= totalQuestions) {
          // Finished
          return renderFinishedScreen();
       } else {
          // Playing
          const question = gameSession.quiz.questions[currentQuestionIndex];
          return (
             <div className="space-y-6">
                <QuestionDisplay
                    key={question.id}
                    question={question}
                    questionNumber={currentQuestionIndex + 1}
                    totalQuestions={totalQuestions}
                    timeLimit={question.timeLimit}
                    onAnswerSelect={handleAnswerSelect}
                    selectedAnswer={selectedAnswer || undefined}
                    showResults={false}
                    isHost={false}
                    playerHasAnswered={hasAnswered}
                />
                {hasAnswered && (
                  <Card className="text-center">
                    <div className="text-white/70 mb-2">Answer submitted!</div>
                    <div className="text-sm text-white/60">Loading next question...</div>
                  </Card>
                )}
             </div>
          );
       }
    }

    // 3. Live Mode Logic
    if (gameSession.status === 'question' || gameSession.status === 'answer_reveal') {
        return (
          <div className="space-y-6">
            <QuestionDisplay
              key={gameSession.quiz.questions[gameSession.currentQuestionIndex].id}
              question={gameSession.quiz.questions[gameSession.currentQuestionIndex]}
              questionNumber={gameSession.currentQuestionIndex + 1}
              totalQuestions={gameSession.quiz.questions.length}
              timeLimit={gameSession.quiz.questions[gameSession.currentQuestionIndex].timeLimit}
              onAnswerSelect={handleAnswerSelect}
              selectedAnswer={selectedAnswer || undefined}
              showResults={gameSession.status === 'answer_reveal'}
              isHost={false}
              playerHasAnswered={hasAnswered}
            />
            {gameSession.status === 'question' && hasAnswered && (
              <Card className="text-center">
                <div className="text-white/70 mb-2">Answer submitted!</div>
                <div className="text-sm text-white/60">
                  Waiting for other players...
                </div>
              </Card>
            )}
            {gameSession.status === 'answer_reveal' && (
              <Card className="text-center">
                <div className="text-white/70 mb-2">The results are in!</div>
                <div className="text-sm text-white/60">
                  Waiting for the host to continue to the leaderboard...
                </div>
              </Card>
            )}
            {gameSession.status === 'answer_reveal' && gameSession.players && gameSession.players.length > 0 && (
              <LiveMiniLeaderboard players={gameSession.players} />
            )}
          </div>
        );
    }

    if (gameSession.status === 'leaderboard') {
         return (
          <div className="space-y-6">
            <Leaderboard
              entries={generateLeaderboard()}
              title={`Question ${gameSession.currentQuestionIndex + 1} Results`}
              showLastQuestionPoints={true}
            />
            <Card className="text-center">
              <div className="text-white/70">
                Waiting for the next question...
              </div>
            </Card>
          </div>
        );
    }

    if (gameSession.status === 'finished') {
        return renderFinishedScreen();
    }

    return null;
  };

  const renderFinishedScreen = () => (
      <div className="space-y-6">
        <Leaderboard
          entries={generateLeaderboard()}
          title="Final Results 🏆"
        />

        <Card className="text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Game Complete!</h3>
          <p className="text-white/70 mb-6">
            Thanks for playing "{gameSession.quiz.title}"!
          </p>

          {(() => {
            const leaderboard = generateLeaderboard();
            const playerEntry = leaderboard.find(entry => entry.playerId === currentPlayer?.id);
            if (playerEntry) {
              return (
                <div className="bg-blue-600/20 rounded-lg p-4 mb-6">
                  <div className="text-white font-semibold">Your Final Position</div>
                  <div className="text-2xl font-bold text-white">
                    #{playerEntry.rank} • {playerEntry.score.toLocaleString()} points
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <Button onClick={() => navigate('/')} icon={<ArrowLeft size={20} />}>
            Back to Home
          </Button>
        </Card>
      </div>
  );

  return (
    <Layout background="game">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {gameSession.quiz.title}
            </h1>
            <p className="text-white/70">
              Playing as: <span className="font-semibold text-white">{currentPlayer.nickname}</span> • Room: <span className="font-mono text-blue-400">{gameSession.roomCode}</span>
            </p>
          </div>

          <Button variant="ghost" onClick={handleLeaveGame} icon={<ArrowLeft size={20} />}>
            Leave Game
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6">
            <div className="flex items-center gap-3 text-red-400">
              <div className="text-2xl">⚠️</div>
              <div>
                <div className="font-semibold">Connection Issue</div>
                <div className="text-sm text-red-300">{error}</div>
              </div>
            </div>
          </Card>
        )}

        {renderContent()}

      </div>
    </Layout>
  );
};
