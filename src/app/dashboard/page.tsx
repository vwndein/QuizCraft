import React from "react";
import { getAuthSession } from "@/lib/nextauth";
import { redirect } from "next/navigation";
import QuizMeCard from "@/components/dashboard/QuizMeCard";
import HistoryCard from "@/components/dashboard/HistoryCard";
import HotTopicsCard from "@/components/dashboard/HotTopicsCard";
import RecentActivities from "@/components/dashboard/RecentActivities";
import prisma from "@/lib/db";
import { getGameStats } from "@/lib/game-stats";

type Props = {
  children?: React.ReactNode;
};

export const metadata = {
  title: "Dashboard - QuizCraft",
  description: "Your personal dashboard for managing quizzes.",
};

const DashboardPage = async (children: Props) => {
  const session = await getAuthSession();
  if (!session?.user) {
    return redirect("/");
  }

  const games = await prisma.game.findMany({
    where: { userId: session.user.id },
    orderBy: { timeStarted: "desc" },
    take: 5,
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

  const totalCount = await prisma.game.count({
    where: { userId: session.user.id },
  });

  const recentGames = games.map((game) => ({
    ...game,
    stats: getGameStats(game),
  }));

  return (
    <main className="p-8 mx-auto max-w-7xl">
      <div className="flex items-center">
        <h2 className="mr-2 text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 mt-4 md:grid-cols-2">
        <QuizMeCard />
        <HistoryCard />
      </div>
      <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-7">
        <HotTopicsCard />
        <RecentActivities games={recentGames} totalCount={totalCount} />
      </div>
    </main>
  );
};
export default DashboardPage;
