import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Game } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { formatGameType, GameStats } from "@/lib/game-stats";

export type RecentGame = Game & { stats: GameStats };

type Props = {
  games: RecentGame[];
  totalCount: number;
};

const RecentActivities = ({ games, totalCount }: Props) => {
  return (
    <Card className="col-span-4 lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Recent Activities</CardTitle>
        <CardDescription>
          You have played a total of {totalCount} quiz
          {totalCount !== 1 ? "zes" : ""}.
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-[580px] overflow-y-auto space-y-3">
        {games.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No activities yet. Create your first quiz to get started.
          </p>
        ) : (
          games.map((game) => (
            <Link
              key={game.id}
              href="/history"
              className="block p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{game.topic}</span>
                <span className="text-xs text-muted-foreground">
                  {formatGameType(game.gameType)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1 text-sm text-muted-foreground">
                <span>{format(game.timeStarted, "MMM d, yyyy")}</span>
                {game.stats.accuracy != null ? (
                  <span>{game.stats.accuracy}%</span>
                ) : game.stats.isComplete ? null : (
                  <span className="text-yellow-600 dark:text-yellow-400">
                    In progress
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivities;
