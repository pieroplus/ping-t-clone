"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Question } from "@/lib/api";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface QuizAnswer {
  questionId: number;
  question: Question;
  selectedChoiceIds: number[];
  isCorrect: boolean;
  correctChoiceIds: number[];
  explanation?: string;
}

export default function SummaryPage() {
  const params = useParams();
  const router = useRouter();
  const titleId = Number(params.id);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const answersStr = sessionStorage.getItem("quizAnswers");
    if (!answersStr || answersStr === "[]") {
      router.push(`/titles/${titleId}/solve`);
      return;
    }

    try {
      const parsed = JSON.parse(answersStr) as QuizAnswer[];
      setAnswers(parsed);
    } catch {
      router.push(`/titles/${titleId}/solve`);
    } finally {
      setLoading(false);
    }
  }, [titleId, router]);

  const handleFinish = () => {
    // セッションをクリア
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("quizAnswers");
      sessionStorage.removeItem("quizResult");
      sessionStorage.removeItem("currentQuestionIndex");
    }
    router.push(`/titles/${titleId}`);
  };

  const handleRestart = () => {
    // セッションをクリア
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("quizAnswers");
      sessionStorage.removeItem("quizResult");
      sessionStorage.removeItem("currentQuestionIndex");
    }
    router.push(`/titles/${titleId}/solve?start=true`);
  };

  const handleViewQuestion = (answer: QuizAnswer) => {
    // 選択した問題の結果データをsessionStorageに保存
    const resultData = {
      question: answer.question,
      selectedChoiceIds: answer.selectedChoiceIds,
      isCorrect: answer.isCorrect,
      explanation: answer.explanation,
      correctChoiceIds: answer.correctChoiceIds,
      currentIndex: answers.findIndex((a) => a.questionId === answer.questionId),
      totalQuestions: answers.length,
      isLastQuestion: false, // summaryから見るので常にfalse
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem("quizResult", JSON.stringify(resultData));
    }

    router.push(`/titles/${titleId}/solve/result`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">結果を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (answers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="text-2xl text-center">
              回答データが見つかりません
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-6">
              先に問題を解いてから結果を確認してください
            </p>
            <Button
              onClick={() => router.push(`/titles/${titleId}/solve?start=true`)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              問題を解く
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalCount = answers.length;
  const incorrectCount = totalCount - correctCount;
  const accuracy = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

  // 円グラフ用データ
  const pieData = [
    { name: "正解", value: correctCount, color: "#22c55e" },
    { name: "不正解", value: incorrectCount, color: "#ef4444" },
  ];

  // グレードを判定
  const getGrade = (acc: number) => {
    if (acc >= 90) return { grade: "S", color: "text-yellow-500", bg: "bg-yellow-50" };
    if (acc >= 80) return { grade: "A", color: "text-blue-500", bg: "bg-blue-50" };
    if (acc >= 70) return { grade: "B", color: "text-green-500", bg: "bg-green-50" };
    if (acc >= 60) return { grade: "C", color: "text-orange-500", bg: "bg-orange-50" };
    return { grade: "D", color: "text-red-500", bg: "bg-red-50" };
  };

  const gradeInfo = getGrade(accuracy);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              クイズ結果
            </h1>
            <p className="text-gray-600">お疲れ様でした！あなたの成績は...</p>
          </div>

          {/* スコアカード */}
          <Card className={`border-2 shadow-xl ${gradeInfo.bg} border-opacity-50`}>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* 左側: スコアとグレード */}
                <div className="text-center space-y-4">
                  <div className={`inline-block px-8 py-4 rounded-2xl ${gradeInfo.bg} border-2 border-current`}>
                    <div className={`text-7xl font-bold ${gradeInfo.color}`}>
                      {gradeInfo.grade}
                    </div>
                  </div>
                  <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {accuracy.toFixed(1)}%
                  </div>
                  <p className="text-xl text-gray-700 font-semibold">
                    {correctCount} / {totalCount} 問正解
                  </p>

                  {/* プログレスバー */}
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000 ease-out rounded-full"
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                </div>

                {/* 右側: 円グラフ */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 統計カード */}
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="text-center p-4 bg-white rounded-xl shadow-md">
                  <div className="text-3xl font-bold text-gray-700">
                    {totalCount}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">総問題数</p>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-md">
                  <div className="text-3xl font-bold text-green-600">
                    {correctCount}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">正解</p>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-md">
                  <div className="text-3xl font-bold text-red-600">
                    {incorrectCount}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">不正解</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 問題一覧 */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="text-2xl">解答した問題一覧</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {answers.map((answer, index) => (
                  <div
                    key={answer.questionId}
                    className={`p-5 border-2 rounded-xl shadow-md transition-all hover:shadow-lg ${
                      answer.isCorrect
                        ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 hover:border-green-400"
                        : "bg-gradient-to-r from-red-50 to-rose-50 border-red-300 hover:border-red-400"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                            answer.isCorrect ? "bg-green-500" : "bg-red-500"
                          }`}>
                            {index + 1}
                          </div>
                          <span
                            className={`text-sm font-bold px-3 py-1 rounded-full ${
                              answer.isCorrect
                                ? "bg-green-600 text-white"
                                : "bg-red-600 text-white"
                            }`}
                          >
                            {answer.isCorrect ? "✓ 正解" : "✗ 不正解"}
                          </span>
                        </div>
                        <p className="text-gray-800 font-medium line-clamp-2 mb-3">
                          {answer.question.text}
                        </p>
                        <div className="bg-white bg-opacity-60 rounded-lg p-3 text-sm">
                          <span className="font-semibold text-gray-700">あなたの回答: </span>
                          <span className="text-gray-600">
                            {answer.selectedChoiceIds
                              .map(
                                (id) =>
                                  answer.question.choices.find((c) => c.id === id)
                                    ?.text
                              )
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewQuestion(answer)}
                        className="hover:bg-white hover:shadow-md transition-all"
                      >
                        詳細を見る
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* アクションボタン */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleRestart}
              variant="outline"
              size="lg"
              className="flex-1 h-14 text-lg font-semibold border-2 hover:bg-blue-50 hover:border-blue-400 transition-all"
            >
              🔄 もう一度解く
            </Button>
            <Button
              onClick={handleFinish}
              size="lg"
              className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              ✓ 完了
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
