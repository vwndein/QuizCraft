import prisma from "@/lib/db";
import { GameType } from "@prisma/client";

export type QuizMeSuggestions = {
  topic: string;
  type: GameType;
  amount: number;
};

export async function getQuizMeSuggestions(
  userId: string
): Promise<QuizMeSuggestions | null> {
  const pastGames = await prisma.game.findMany({
    where: { userId },
    orderBy: { timeStarted: "desc" },
    take: 20,
    select: { topic: true, gameType: true },
  });

  if (pastGames.length === 0) return null;

  const topicCounts = pastGames.reduce<Record<string, number>>((acc, game) => {
    acc[game.topic] = (acc[game.topic] ?? 0) + 1;
    return acc;
  }, {});

  const topic = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0][0];

  return {
    topic,
    type: pastGames[0].gameType,
    amount: 5,
  };
}
