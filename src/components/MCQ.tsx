"use client";
import React from "react";
import { Game, Question } from "@prisma/client";
import { differenceInSeconds } from "date-fns";
import { ChevronRight, Timer } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import MCQCounter from "@/components/MCQCounter";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { checkAnswerSchema, endGameSchema } from "@/schemas/form/quiz";
import z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { formatTimeDelta, parseQuestionOptions } from "@/lib/utils";

type Props = {
  game: Game & { questions: Pick<Question, "id" | "options" | "question">[] };
};

const MCQ = ({ game }: Props) => {
  const router = useRouter();
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const [selectedChoice, setSelectedChoice] = React.useState<number | null>(
    null
  );
  const [correctAnswers, setCorrectAnswer] = React.useState<number>(0);
  const [wrongAnswers, setWrongAnswer] = React.useState<number>(0);
  const [hasFinished, setHasFinished] = React.useState(false);
  const [now, setNow] = React.useState(new Date());
  const { toast } = useToast();

  const { mutate: endGame } = useMutation({
    mutationFn: async () => {
      const payload: z.infer<typeof endGameSchema> = { gameId: game.id };
      const response = await axios.post("/api/endGame", payload);
      return response.data;
    },
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!hasFinished) {
        setNow(new Date());
      }
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [hasFinished]);

  const currentQuestion = React.useMemo(
    () => game.questions[questionIndex],
    [questionIndex, game.questions]
  );

  const options = React.useMemo(() => {
    if (!currentQuestion?.options) return [];
    const parsed = parseQuestionOptions(currentQuestion.options);
    const unique = Array.from(
      new Set(parsed.map((o) => o.toLowerCase().trim()))
    );
    return unique.slice(0, 4);
  }, [currentQuestion]);

  // Mutation để check answer
  const { mutate: checkAnswer, isPending: isChecking } = useMutation({
    mutationFn: async () => {
      if (selectedChoice === null) throw new Error("No answer selected");

      const payload: z.infer<typeof checkAnswerSchema> = {
        questionId: currentQuestion.id,
        userAnswer: options[selectedChoice],
      };

      const response = await axios.post("/api/checkAnswer", payload);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.isCorrect) {
        toast({
          title: "Correct! ✅",
          description: "Great job!",
        });
        setCorrectAnswer((prev) => prev + 1);
      } else {
        toast({
          title: "Wrong! ❌",
          description: "Better luck next time!",
          variant: "destructive",
        });
        setWrongAnswer((prev) => prev + 1);
      }

      // Check if this was the last question
      if (questionIndex + 1 >= game.questions.length) {
        endGame();
        setTimeout(() => {
          setHasFinished(true);
        }, 1000);
      } else {
        // Move to next question
        setTimeout(() => {
          setQuestionIndex((prev) => prev + 1);
          setSelectedChoice(null);
        }, 1000);
      }
    },
    onError: (error: any) => {
      console.error("Error checking answer:", error);

      toast({
        title: "Error",
        description:
          error.response?.data?.error ||
          "Failed to check answer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle khi click Next
  const handleNext = React.useCallback(() => {
    if (selectedChoice === null) {
      toast({
        title: "Please select an answer",
        variant: "destructive",
      });
      return;
    }
    checkAnswer();
  }, [checkAnswer, selectedChoice, toast]);

  if (!currentQuestion || game.questions.length === 0) {
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4">
        <Card>
          <CardHeader>
            <CardTitle>Quiz not available</CardTitle>
            <CardDescription>
              This quiz has no questions. Please try creating a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/quiz")}>Create a Quiz</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show completion screen
  if (hasFinished) {
    const accuracy = Math.round((correctAnswers / game.questions.length) * 100);

    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Card className="w-[500px]">
          <CardHeader>
            <CardTitle className="text-3xl text-center font-bold">
              Quiz Completed! 🎉
            </CardTitle>
            <CardDescription className="text-center text-lg mt-6">
              <div className="space-y-6">
                <div className="flex justify-around">
                  <div>
                    <div className="text-4xl font-bold text-green-500">
                      {correctAnswers}
                    </div>
                    <div className="text-sm text-muted-foreground">Correct</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-red-500">
                      {wrongAnswers}
                    </div>
                    <div className="text-sm text-muted-foreground">Wrong</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-blue-500">
                      {accuracy}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Accuracy
                    </div>
                  </div>
                </div>

                <div className="text-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    Completed in
                  </div>
                  <div className="text-2xl font-semibold text-purple-500">
                    {formatTimeDelta(
                      differenceInSeconds(now, game.timeStarted)
                    )}
                    ⏱️
                  </div>
                </div>

                <div className="flex gap-3 justify-center mt-6">
                  <Button
                    onClick={() => router.push("/history")}
                    variant="outline"
                  >
                    View History
                  </Button>
                  <Button onClick={() => router.push("/quiz")}>
                    Play Again
                  </Button>
                </div>
              </div>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:w-[80vw] max-w-4xl w-[90vw]">
      {/* Header */}
      <div className="flex flex-row justify-between">
        <div className="flex flex-col">
          <p>
            <span className="text-slate-400 mr-2">Topic</span>
            <span className="px-2 py-1 text-white rounded-lg bg-slate-800">
              {game.topic}
            </span>
          </p>
          <div className="flex self-start mt-3 text-slate-400">
            <Timer className="mr-2" />
            {formatTimeDelta(differenceInSeconds(now, game.timeStarted))}
          </div>
        </div>
        <MCQCounter
          correctAnswers={correctAnswers}
          wrongAnswer={wrongAnswers}
        />
      </div>

      {/* Question Card */}
      <Card className="w-full mt-4">
        <CardHeader className="flex flex-row items-center">
          <CardTitle className="mr-5 text-center divide-y divide-zinc-800/50">
            <div>{questionIndex + 1}</div>
            <div className="text-base text-slate-400">
              {game.questions.length}
            </div>
          </CardTitle>
          <CardDescription className="flex-grow text-lg">
            {currentQuestion.question}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Options */}
      <div className="flex flex-col items-center justify-center w-full mt-4">
        {options.length === 0 ? (
          <p className="text-red-500">Error: No options available</p>
        ) : (
          options.map((option, index) => (
            <Button
              key={`${currentQuestion.id}-${index}`}
              className="justify-start py-8 w-full mb-4 cursor-pointer"
              variant={selectedChoice === index ? "default" : "secondary"}
              onClick={() => setSelectedChoice(index)}
              disabled={isChecking}
            >
              <div className="flex items-center justify-start">
                <div className="p-2 px-3 mr-5 border rounded-md">
                  {index + 1}
                </div>
                <div className="text-start">{option}</div>
              </div>
            </Button>
          ))
        )}

        {/* Next Button */}
        <Button
          onClick={handleNext}
          disabled={isChecking || selectedChoice === null}
          className="mt-2"
        >
          {isChecking
            ? "Checking..."
            : questionIndex + 1 === game.questions.length
              ? "Finish"
              : "Next"}{" "}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default MCQ;
