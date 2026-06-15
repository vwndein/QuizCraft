import { Game, GameType, Question } from "@prisma/client";
import { differenceInSeconds } from "date-fns";

type GameWithQuestions = Game & {
  questions: Pick<
    Question,
    "isCorrect" | "percentageCorrect" | "userAnswer" | "questionType"
  >[];
};

export type GameStats = {
  isComplete: boolean;
  answeredCount: number;
  totalQuestions: number;
  correctCount?: number;
  wrongCount?: number;
  accuracy: number | null;
  durationSeconds: number | null;
};

export function getGameStats(game: GameWithQuestions): GameStats {
  const totalQuestions = game.questions.length;
  const answeredCount = game.questions.filter(
    (q) => q.userAnswer != null
  ).length;
  const isComplete =
    game.timeEnded != null || answeredCount === totalQuestions;

  const durationSeconds =
    game.timeEnded != null
      ? differenceInSeconds(game.timeEnded, game.timeStarted)
      : isComplete
        ? differenceInSeconds(new Date(), game.timeStarted)
        : null;

  if (game.gameType === GameType.mcq) {
    const correctCount = game.questions.filter(
      (q) => q.isCorrect === true
    ).length;
    const wrongCount = game.questions.filter(
      (q) => q.isCorrect === false
    ).length;
    const accuracy =
      totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : null;

    return {
      isComplete,
      answeredCount,
      totalQuestions,
      correctCount,
      wrongCount,
      accuracy: answeredCount > 0 ? accuracy : null,
      durationSeconds,
    };
  }

  const scores = game.questions
    .map((q) => q.percentageCorrect)
    .filter((p): p is number => p != null);

  const accuracy =
    scores.length > 0
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : null;

  return {
    isComplete,
    answeredCount,
    totalQuestions,
    accuracy,
    durationSeconds,
  };
}

export function formatGameType(type: GameType): string {
  return type === GameType.mcq ? "Multiple Choice" : "Open Ended";
}
