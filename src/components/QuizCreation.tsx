"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useForm } from "react-hook-form";
import { quizCreationSchema } from "@/schemas/form/quiz";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, CopyCheck } from "lucide-react";
import { Separator } from "./ui/separator";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { GameType } from "@prisma/client";

type InputType = z.infer<typeof quizCreationSchema>;

type Props = {
  fromQuizMe?: boolean;
  suggestedDefaults?: {
    topic: string;
    type: GameType;
    amount: number;
  } | null;
};

const QuizCreation = ({ fromQuizMe = false, suggestedDefaults }: Props) => {
  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationFn: async (input: InputType) => {
      const res = await axios.post("/api/game", input);
      return res.data;
    },
  });

  const form = useForm<InputType>({
    resolver: zodResolver(quizCreationSchema),
    defaultValues: {
      amount: suggestedDefaults?.amount ?? 3,
      topic: suggestedDefaults?.topic ?? "",
      type: suggestedDefaults?.type ?? "open_ended",
    },
  });

  function onSubmit(input: InputType) {
    mutate(input, {
      onSuccess: ({ gameId }) => {
        if (input.type === "open_ended") {
          router.push(`/play/open-ended/${gameId}`);
        } else {
          router.push(`/play/mcq/${gameId}`);
        }
      },
    });
  }

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Quiz Creation</CardTitle>
          <CardDescription>
            {fromQuizMe && suggestedDefaults
              ? `Suggested from your history: ${suggestedDefaults.topic}`
              : fromQuizMe
                ? "No quiz history yet — choose a topic to get started"
                : "Choose a topic"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="React, AI, Math..." {...field} />
                    </FormControl>
                    <FormDescription>Enter the quiz topic</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Questions</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        {...field}
                        onChange={(e) =>
                          form.setValue("amount", Number(e.target.value))
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex">
                <Button
                  type="button"
                  className="w-1/2 rounded-none rounded-l-lg"
                  variant={
                    form.watch("type") === "mcq" ? "default" : "secondary"
                  }
                  onClick={() => form.setValue("type", "mcq")}
                >
                  <CopyCheck className="h-4 w-4 mr-2" />
                  Multiple Choice
                </Button>

                <Separator orientation="vertical" />

                <Button
                  type="button"
                  className="w-1/2 rounded-none rounded-r-lg"
                  variant={
                    form.watch("type") === "open_ended"
                      ? "default"
                      : "secondary"
                  }
                  onClick={() => form.setValue("type", "open_ended")}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Open Ended
                </Button>
              </div>

              <Button disabled={isPending} type="submit">
                Create Quiz
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizCreation;
