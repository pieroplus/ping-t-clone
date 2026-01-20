'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { getQuestion, updateQuestion, deleteQuestion, ApiError, ChoiceInput } from '@/lib/api';

interface ChoiceState extends ChoiceInput {
  id: string;
}

export default function EditQuestionPage() {
  const params = useParams();
  const titleId = Number(params.id);
  const questionId = Number(params.qid);
  const [text, setText] = useState('');
  const [questionType, setQuestionType] = useState<'single' | 'multiple'>('single');
  const [explanation, setExplanation] = useState('');
  const [choices, setChoices] = useState<ChoiceState[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    loadQuestion();
  }, [questionId]);

  const loadQuestion = async () => {
    setLoading(true);
    try {
      const question = await getQuestion(questionId);
      setText(question.text);
      setQuestionType(question.question_type);
      setExplanation(question.explanation || '');
      setChoices(
        question.choices.map((c) => ({
          id: String(c.id),
          text: c.text,
          is_correct: c.is_correct || false,
        }))
      );
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 403) {
          toast({
            title: '権限エラー',
            description: 'この操作を実行する権限がありません',
            variant: 'destructive',
          });
          router.push(`/titles/${titleId}/edit`);
        } else {
          toast({
            title: '読み込みエラー',
            description: error.message || 'データの読み込みに失敗しました',
            variant: 'destructive',
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddChoice = () => {
    if (choices.length >= 5) {
      toast({
        title: '選択肢追加不可',
        description: '選択肢は最大5つまでです',
        variant: 'destructive',
      });
      return;
    }
    const newId = String(Date.now());
    setChoices([...choices, { id: newId, text: '', is_correct: false }]);
  };

  const handleRemoveChoice = (id: string) => {
    if (choices.length <= 2) {
      toast({
        title: '選択肢削除不可',
        description: '選択肢は最低2つ必要です',
        variant: 'destructive',
      });
      return;
    }
    setChoices(choices.filter((c) => c.id !== id));
  };

  const handleChoiceTextChange = (id: string, value: string) => {
    setChoices(choices.map((c) => (c.id === id ? { ...c, text: value } : c)));
  };

  const handleChoiceCorrectChange = (id: string, checked: boolean) => {
    if (questionType === 'single' && checked) {
      setChoices(choices.map((c) => ({ ...c, is_correct: c.id === id })));
    } else {
      setChoices(choices.map((c) => (c.id === id ? { ...c, is_correct: checked } : c)));
    }
  };

  const validateForm = (): boolean => {
    const correctCount = choices.filter((c) => c.is_correct).length;

    if (questionType === 'single' && correctCount !== 1) {
      toast({
        title: 'バリデーションエラー',
        description: '単一選択の場合、正解を1つだけ選択してください',
        variant: 'destructive',
      });
      return false;
    }

    if (questionType === 'multiple' && correctCount < 2) {
      toast({
        title: 'バリデーションエラー',
        description: '複数選択の場合、正解を2つ以上選択してください',
        variant: 'destructive',
      });
      return false;
    }

    if (choices.some((c) => !c.text.trim())) {
      toast({
        title: 'バリデーションエラー',
        description: '全ての選択肢にテキストを入力してください',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      await updateQuestion(questionId, {
        text,
        question_type: questionType,
        explanation: explanation || undefined,
        choices: choices.map((c, index) => ({
          text: c.text,
          is_correct: c.is_correct,
          order: index + 1,
        })),
      });
      toast({
        title: '問題更新成功',
        description: '問題が正常に更新されました',
      });
      router.push(`/titles/${titleId}/edit`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errors) {
          setErrors(error.errors);
        } else {
          toast({
            title: '問題更新失敗',
            description: error.message || '問題の更新に失敗しました',
            variant: 'destructive',
          });
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteQuestion(questionId);
      toast({
        title: '問題削除成功',
        description: '問題が正常に削除されました',
      });
      router.push(`/titles/${titleId}/edit`);
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: '問題削除失敗',
          description: error.message || '問題の削除に失敗しました',
          variant: 'destructive',
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
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>問題編集</CardTitle>
            <CardDescription>問題と選択肢を編集します</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="text">問題文</Label>
                <textarea
                  id="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                  disabled={submitting}
                  className="w-full min-h-25 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.text && (
                  <p className="text-sm text-red-600">{errors.text.join(', ')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="question_type">問題タイプ</Label>
                <select
                  id="question_type"
                  value={questionType}
                  onChange={(e) => {
                    const newType = e.target.value as 'single' | 'multiple';
                    setQuestionType(newType);
                    if (newType === 'single') {
                      const firstCorrect = choices.findIndex((c) => c.is_correct);
                      setChoices(
                        choices.map((c, i) => ({
                          ...c,
                          is_correct: firstCorrect >= 0 ? i === firstCorrect : i === 0,
                        }))
                      );
                    }
                  }}
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="single">単一選択</option>
                  <option value="multiple">複数選択</option>
                </select>
                {errors.question_type && (
                  <p className="text-sm text-red-600">{errors.question_type.join(', ')}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>選択肢 (2〜5個) - 正解にチェックを入れてください</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddChoice}
                    disabled={submitting || choices.length >= 5}
                  >
                    選択肢を追加
                  </Button>
                </div>

                {choices.map((choice, index) => (
                  <Card key={choice.id}>
                    <CardContent className="pt-4">
                      <div className="flex gap-2 items-start">
                        <div className="flex flex-col items-center gap-1 pt-2">
                          <Checkbox
                            id={`choice-${choice.id}`}
                            checked={choice.is_correct}
                            onCheckedChange={(checked) =>
                              handleChoiceCorrectChange(choice.id, checked === true)
                            }
                            disabled={submitting}
                          />
                          <Label htmlFor={`choice-${choice.id}`} className="text-xs text-gray-600">
                            正解
                          </Label>
                        </div>
                        <div className="flex-1">
                          <Label htmlFor={`choice-text-${choice.id}`} className="text-sm">
                            選択肢 {index + 1}
                          </Label>
                          <Input
                            id={`choice-text-${choice.id}`}
                            value={choice.text}
                            onChange={(e) => handleChoiceTextChange(choice.id, e.target.value)}
                            placeholder="選択肢のテキスト"
                            required
                            disabled={submitting}
                            className="mt-1"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveChoice(choice.id)}
                          disabled={submitting || choices.length <= 2}
                        >
                          削除
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {errors.choices && (
                  <p className="text-sm text-red-600">{errors.choices.join(', ')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="explanation">解説（任意）</Label>
                <textarea
                  id="explanation"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  disabled={submitting}
                  className="w-full min-h-25 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="問題の解説を入力してください"
                />
                {errors.explanation && (
                  <p className="text-sm text-red-600">{errors.explanation.join(', ')}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? '更新中...' : '更新'}
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
                    <Button type="button" variant="destructive" disabled={submitting}>
                      削除
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>問題を削除しますか？</AlertDialogTitle>
                      <AlertDialogDescription>
                        この操作は取り消せません。問題が完全に削除されます。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>キャンセル</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>削除</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
