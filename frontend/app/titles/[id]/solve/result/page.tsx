"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Question,
  QuestionNote,
  getQuestionNote,
  createQuestionNote,
  updateQuestionNote,
  deleteQuestionNote
} from "@/lib/api";

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
  const { toast } = useToast();
  const titleId = Number(params.id);
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [note, setNote] = useState("");
  const [noteId, setNoteId] = useState<number | null>(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [hasMultipleAnswers, setHasMultipleAnswers] = useState(false);

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

      // 回答履歴が複数あるかチェック
      const answersStr = sessionStorage.getItem("quizAnswers");
      if (answersStr) {
        const answers = JSON.parse(answersStr);
        setHasMultipleAnswers(answers.length >= 1);
      }
    } catch {
      router.push(`/titles/${titleId}/solve`);
    }
  }, [titleId, router]);

  useEffect(() => {
    if (resultData?.question.id) {
      loadNote(resultData.question.id);
    }
  }, [resultData?.question.id]);

  const loadNote = async (questionId: number) => {
    setNoteLoading(true);
    try {
      const noteData = await getQuestionNote(questionId);
      setNote(noteData.note);
      setNoteId(noteData.id);
    } catch (error) {
      // 404 エラーの場合はメモが存在しないだけなので何もしない
      setNote("");
      setNoteId(null);
    } finally {
      setNoteLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!resultData) return;

    if (note.trim() === "") {
      toast({
        title: "エラー",
        description: "メモを入力してください",
        variant: "destructive",
      });
      return;
    }

    setNoteSaving(true);
    try {
      if (noteId) {
        // 更新
        await updateQuestionNote(resultData.question.id, { note });
        toast({
          title: "保存しました",
          description: "メモを更新しました",
        });
      } else {
        // 新規作成
        const newNote = await createQuestionNote(resultData.question.id, { note });
        setNoteId(newNote.id);
        toast({
          title: "保存しました",
          description: "メモを作成しました",
        });
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "メモの保存に失敗しました",
        variant: "destructive",
      });
    } finally {
      setNoteSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!resultData || !noteId) return;

    if (!confirm("メモを削除してもよろしいですか？")) return;

    setNoteSaving(true);
    try {
      await deleteQuestionNote(resultData.question.id);
      setNote("");
      setNoteId(null);
      toast({
        title: "削除しました",
        description: "メモを削除しました",
      });
    } catch (error) {
      toast({
        title: "エラー",
        description: "メモの削除に失敗しました",
        variant: "destructive",
      });
    } finally {
      setNoteSaving(false);
    }
  };

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
      // 最終結果画面へ遷移
      router.push(`/titles/${titleId}/solve/summary`);
    } else {
      router.push(`/titles/${titleId}/solve`);
    }
  };

  const handleGoToSummary = () => {
    router.push(`/titles/${titleId}/solve/summary`);
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

          {/* メモ */}
          <Card>
            <CardHeader>
              <CardTitle>メモ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {noteLoading ? (
                <p className="text-sm text-gray-500">読み込み中...</p>
              ) : (
                <>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="この問題についてのメモを入力..."
                    className="min-h-[100px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveNote}
                      disabled={noteSaving || note.trim() === ""}
                    >
                      {noteSaving ? "保存中..." : "保存"}
                    </Button>
                    {noteId && (
                      <Button
                        variant="destructive"
                        onClick={handleDeleteNote}
                        disabled={noteSaving}
                      >
                        削除
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 次へボタン */}
          <div className="flex flex-col gap-3">
            <Button onClick={handleNext} className="w-full" size="lg">
              {resultData.isLastQuestion ? "最終結果を見る" : "次の問題へ"}
            </Button>

            {/* 回答履歴がある場合、最終結果へのリンクを表示 */}
            {hasMultipleAnswers && !resultData.isLastQuestion && (
              <Button
                onClick={handleGoToSummary}
                variant="outline"
                className="w-full"
              >
                これまでの結果を見る
              </Button>
            )}
          </div>

          <div className="text-center text-sm text-gray-600">
            問題 {resultData.currentIndex + 1} / {resultData.totalQuestions}
          </div>
        </div>
      </div>
    </div>
  );
}
