"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Game, GameType } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatGameType, GameStats } from "@/lib/game-stats";
import { formatTimeDelta } from "@/lib/utils";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  CopyCheck,
  Play,
} from "lucide-react";

export type HistoryGame = Game & { stats: GameStats };

type Props = {
  games: HistoryGame[];
};

const HistoryList = ({ games }: Props) => {
  if (games.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No quiz history yet</CardTitle>
          <CardDescription>
            Play your first quiz and your results will show up here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/quiz">Create a Quiz</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {games.map((game) => (
        <Card key={game.id}>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-xl">{game.topic}</CardTitle>
              <CardDescription>
                {format(game.timeStarted, "MMM d, yyyy 'at' h:mm a")}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {game.gameType === GameType.mcq ? (
                <CopyCheck className="w-4 h-4 text-muted-foreground" />
              ) : (
                <BookOpen className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">
                {formatGameType(game.gameType)}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <StatusBadge stats={game.stats} />
              {game.stats.accuracy != null && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {game.stats.accuracy}% accuracy
                </span>
              )}
              {game.stats.durationSeconds != null && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {formatTimeDelta(game.stats.durationSeconds)}
                </span>
              )}
              <span className="text-muted-foreground">
                {game.stats.answeredCount}/{game.stats.totalQuestions} answered
              </span>
            </div>

            {!game.stats.isComplete && (
              <Button asChild size="sm" className="mt-4">
                <Link
                  href={
                    game.gameType === GameType.mcq
                      ? `/play/mcq/${game.id}`
                      : `/play/open-ended/${game.id}`
                  }
                >
                  <Play className="w-4 h-4" />
                  Continue Quiz
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

function StatusBadge({ stats }: { stats: GameStats }) {
  if (stats.isComplete) {
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        Completed
      </span>
    );
  }

  if (stats.answeredCount > 0) {
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
        In Progress
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
      Not Started
    </span>
  );
}

export default HistoryList;
