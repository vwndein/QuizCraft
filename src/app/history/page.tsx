import React from "react";
import Link from "next/link";
import { getAuthSession } from "@/lib/nextauth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import HistoryList from "@/components/history/HistoryList";
import { getGameStats } from "@/lib/game-stats";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "History - QuizCraft",
  description: "Review your past quiz attempts.",
};

const HistoryPage = async () => {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return redirect("/");
  }

  const games = await prisma.game.findMany({
    where: { userId: session.user.id },
    orderBy: { timeStarted: "desc" },
    include: {
      questions: {
        select: {
          isCorrect: true,
          percentageCorrect: true,
          userAnswer: true,
          questionType: true,
        },
      },
    },
  });

  const gamesWithStats = games.map((game) => ({
    ...game,
    stats: getGameStats(game),
  }));

  const completedGames = gamesWithStats.filter((g) => g.stats.isComplete);
  const gamesWithAccuracy = completedGames.filter(
    (g) => g.stats.accuracy != null
  );
  const avgAccuracy =
    gamesWithAccuracy.length > 0
      ? Math.round(
          gamesWithAccuracy.reduce(
            (sum, g) => sum + (g.stats.accuracy ?? 0),
            0
          ) / gamesWithAccuracy.length
        )
      : null;

  return (
    <main className="p-8 mx-auto max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Quiz History</h1>
        <p className="mt-1 text-muted-foreground">
          Review your past quiz attempts and track your progress.
        </p>
        {games.length > 0 && (
          <div className="flex gap-6 mt-4 text-sm">
            <div>
              <span className="text-2xl font-bold">{games.length}</span>
              <span className="ml-2 text-muted-foreground">total quizzes</span>
            </div>
            {avgAccuracy != null && !Number.isNaN(avgAccuracy) && (
              <div>
                <span className="text-2xl font-bold">{avgAccuracy}%</span>
                <span className="ml-2 text-muted-foreground">avg accuracy</span>
              </div>
            )}
          </div>
        )}
      </div>

      <HistoryList games={gamesWithStats} />
    </main>
  );
};

export default HistoryPage;
