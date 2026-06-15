"use client";
import { useTheme } from "next-themes";
import React from "react";
import D3WordCloud from "react-d3-cloud";

type Props = {
  children?: React.ReactNode;
};

const data = [
  { text: "AI", value: 80 },
  { text: "React", value: 75 },
  { text: "Next.js", value: 70 },
  { text: "Quiz", value: 68 },
  { text: "JavaScript", value: 65 },
  { text: "TypeScript", value: 60 },
  { text: "Tailwind", value: 55 },
  { text: "Frontend", value: 50 },
  { text: "Backend", value: 48 },
  { text: "Fullstack", value: 45 },

  { text: "Database", value: 40 },
  { text: "Supabase", value: 35 },
  { text: "PostgreSQL", value: 30 },
  { text: "Auth", value: 28 },
  { text: "NextAuth", value: 25 },
  { text: "Cloud", value: 22 },
  { text: "API", value: 18 },
  { text: "Performance", value: 15 },
  { text: "Security", value: 10 },
  { text: "Testing", value: 3 },
];



const fontSizeMapper = (word: { value: number }) =>
  Math.log2(word.value) * 5 + 16;

const CustomWordCloud = (children: Props) => {
  const theme = useTheme();
  return (
    <D3WordCloud
      height={550}
      data={data}
      font="Times"
      fontSize={fontSizeMapper}
      rotate={0}
      padding={10}
      fill={theme.theme == "dark" ? "white" : "black"}
    />
  );
};
export default CustomWordCloud;
