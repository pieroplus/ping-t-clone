"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Question } from "@/lib/api";

interface ResultData {
  question: Question;
  selectedChoiceIds: number[];
  isCorrect: boolean;
  explanation?: string;
  correctChoiceIds: number[];
  currentIndex: number;
  totalQuestions: number;
  isLastQuestion: boolean;
}

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const titleId = Number(params.id);
  const [resultData, setResultData] = useState<ResultData | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const data = sessionStorage.getItem("quizResult");
    if (!data) {
      router.push(`/titles/${titleId}/solve`);
      return;
    }

    try {
      const parsed = JSON.parse(data) as ResultData;
      setResultData(parsed);
    } catch {
      router.push(`/titles/${titleId}/solve`);
    }
  }, [titleId, router]);

  const handleNext = () => {
    // sessionStorageをクリーンアップ
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("quizResult");

      if (resultData && !resultData.isLastQuestion) {
        sessionStorage.setItem(
          "currentQuestionIndex",
          String(resultData.currentIndex + 1)
        );
      }
    }

    if (resultData?.isLastQuestion) {
      router.push("/titles");
    } else {
      router.push(`/titles/${titleId}/solve`);
    }
  };

  if (!resultData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  const {
    question,
    selectedChoiceIds,
    isCorrect,
    explanation,
    correctChoiceIds,
  } = resultData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* 結果ヘッダー */}
          <Card className={isCorrect ? "border-green-500" : "border-red-500"}>
            <CardHeader>
              <CardTitle
                className={isCorrect ? "text-green-600" : "text-red-600"}
              >
                {isCorrect ? "✓ 正解" : "✗ 不正解"}
              </CardTitle>
            </CardHeader>
          </Card>

          {/* 問題文 */}
          <Card>
            <CardHeader>
              <CardTitle>問題</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg whitespace-pre-wrap">{question.text}</p>
              <p className="text-sm text-gray-600 mt-2">
                ({question.question_type === "single" ? "単一選択" : "複数選択"}
                )
              </p>
            </CardContent>
          </Card>

          {/* 選択肢一覧 */}
          <Card>
            <CardHeader>
              <CardTitle>選択肢</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {question.choices.map((choice) => {
                const isSelected = selectedChoiceIds.includes(choice.id);
                const isCorrectChoice = correctChoiceIds.includes(choice.id);

                let bgColor = "";
                let borderColor = "border-gray-200";
                let label = "";

                if (isCorrectChoice && isSelected) {
                  bgColor = "bg-green-50";
                  borderColor = "border-green-500";
                  label = "正解（あなたの回答）";
                } else if (isCorrectChoice) {
                  bgColor = "bg-green-50";
                  borderColor = "border-green-500";
                  label = "正解";
                } else if (isSelected) {
                  bgColor = "bg-red-50";
                  borderColor = "border-red-500";
                  label = "あなたの回答";
                }

                return (
                  <div
                    key={choice.id}
                    className={`p-4 border rounded-lg ${bgColor} ${borderColor}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-1">{choice.text}</span>
                      {label && (
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            isCorrectChoice
                              ? "bg-green-600 text-white"
                              : "bg-red-600 text-white"
                          }`}
                        >
                          {label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* 解説 */}
          {explanation && (
            <Card>
              <CardHeader>
                <CardTitle>解説</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{explanation}</p>
              </CardContent>
            </Card>
          )}

          {/* 次へボタン */}
          <div className="flex gap-4">
            <Button onClick={handleNext} className="w-full" size="lg">
              {resultData.isLastQuestion ? "完了" : "次の問題へ"}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600">
            問題 {resultData.currentIndex + 1} / {resultData.totalQuestions}
          </div>
        </div>
      </div>
    </div>
  );
}
