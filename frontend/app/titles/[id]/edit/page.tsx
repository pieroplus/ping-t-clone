"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  getTitle,
  getTitleQuestions,
  updateTitle,
  deleteTitle,
  deleteQuestion,
  ApiError,
  Question,
} from "@/lib/api";

export default function EditTitlePage() {
  const params = useParams();
  const titleId = Number(params.id);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "private" | "public">("draft");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [titleId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [titleData, questionsData] = await Promise.all([
        getTitle(titleId),
        getTitleQuestions(titleId),
      ]);
      setName(titleData.name);
      setDescription(titleData.description || "");
      setStatus(titleData.status);
      setQuestions(questionsData);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 403) {
          toast({
            title: "権限エラー",
            description: "この操作を実行する権限がありません",
            variant: "destructive",
          });
          router.push("/titles");
        } else {
          toast({
            title: "読み込みエラー",
            description: error.message || "データの読み込みに失敗しました",
            variant: "destructive",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      await updateTitle(titleId, { name, description, status });
      toast({
        title: "タイトル更新成功",
        description: "タイトルが正常に更新されました",
      });
      router.push(`/titles/${titleId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errors) {
          setErrors(error.errors);
        } else {
          toast({
            title: "タイトル更新失敗",
            description: error.message || "タイトルの更新に失敗しました",
            variant: "destructive",
          });
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTitle = async () => {
    try {
      await deleteTitle(titleId);
      toast({
        title: "タイトル削除成功",
        description: "タイトルが正常に削除されました",
      });
      router.push("/titles");
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "タイトル削除失敗",
          description: error.message || "タイトルの削除に失敗しました",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    try {
      await deleteQuestion(questionId);
      toast({
        title: "問題削除成功",
        description: "問題が正常に削除されました",
      });
      loadData();
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "問題削除失敗",
          description: error.message || "問題の削除に失敗しました",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>タイトル編集</CardTitle>
              <CardDescription>タイトル情報を編集します</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">タイトル名</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={submitting}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">
                      {errors.name.join(", ")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">説明</Label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={submitting}
                    className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">
                      {errors.description.join(", ")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">ステータス</Label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) =>
                      setStatus(
                        e.target.value as "draft" | "private" | "public"
                      )
                    }
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">下書き</option>
                    <option value="private">非公開</option>
                    <option value="public">公開</option>
                  </select>
                  {errors.status && (
                    <p className="text-sm text-red-600">
                      {errors.status.join(", ")}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "更新中..." : "更新"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={submitting}
                  >
                    キャンセル
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={submitting}
                      >
                        削除
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          タイトルを削除しますか？
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          この操作は取り消せません。タイトルと関連する全ての問題が削除されます。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTitle}>
                          削除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>問題一覧</CardTitle>
                <Link href={`/titles/${titleId}/questions/new`}>
                  <Button>問題を追加</Button>
                </Link>
              </div>
              <CardDescription>このタイトルの問題を管理します</CardDescription>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  問題がまだありません
                </p>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <Card key={question.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">問題 {index + 1}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {question.text}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              タイプ:{" "}
                              {question.question_type === "single"
                                ? "単一選択"
                                : "複数選択"}{" "}
                              | 選択肢: {question.choices.length}個
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Link
                              href={`/titles/${titleId}/questions/${question.id}/edit`}
                            >
                              <Button size="sm" variant="outline">
                                編集
                              </Button>
                            </Link>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  削除
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    問題を削除しますか？
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    この操作は取り消せません。問題が完全に削除されます。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    キャンセル
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteQuestion(question.id)
                                    }
                                  >
                                    削除
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
