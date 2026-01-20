'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { getTitleQuestions, checkAnswer, Question } from '@/lib/api';

export default function SolvePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const titleId = Number(params.id);
  const random = searchParams.get('random') === 'true';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoices, setSelectedChoices] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuestions();
    // resultページから戻ってきた場合、次の問題インデックスを復元
    if (typeof window !== 'undefined') {
      const savedIndex = sessionStorage.getItem('currentQuestionIndex');
      if (savedIndex) {
        setCurrentIndex(Number(savedIndex));
        sessionStorage.removeItem('currentQuestionIndex');
      }
    }
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await getTitleQuestions(titleId, random);
      setQuestions(data);
    } catch (error) {
      toast({
        title: 'エラー',
        description: '問題の読み込みに失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleChoiceToggle = (choiceId: number) => {
    if (currentQuestion.question_type === 'single') {
      setSelectedChoices([choiceId]);
    } else {
      setSelectedChoices((prev) =>
        prev.includes(choiceId)
          ? prev.filter((id) => id !== choiceId)
          : [...prev, choiceId]
      );
    }
  };

  const handleSubmit = async () => {
    if (selectedChoices.length === 0) {
      toast({
        title: '選択してください',
        description: '回答を選択してから送信してください',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await checkAnswer(currentQuestion.id, {
        selected_choice_ids: selectedChoices,
      });

      // 結果データをsessionStorageに保存
      const resultData = {
        question: currentQuestion,
        selectedChoiceIds: selectedChoices,
        isCorrect: result.is_correct,
        explanation: result.explanation,
        correctChoiceIds: result.correct_choice_ids,
        currentIndex,
        totalQuestions: questions.length,
        isLastQuestion: currentIndex === questions.length - 1,
      };

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('quizResult', JSON.stringify(resultData));
      }

      // 結果ページへ遷移
      router.push(`/titles/${titleId}/solve/result`);
    } catch (error) {
      toast({
        title: 'エラー',
        description: '採点に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>問題を読み込み中...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>問題が見つかりません</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/titles')}>
              タイトル一覧に戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4 flex justify-between items-center">
            <Button variant="outline" onClick={() => router.push('/titles')}>
              戻る
            </Button>
            <span className="text-sm text-gray-600">
              問題 {currentIndex + 1} / {questions.length}
            </span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {currentQuestion.question_type === 'single' ? '単一選択' : '複数選択'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-lg font-medium whitespace-pre-wrap">
                {currentQuestion.text}
              </div>

              <div className="space-y-3">
                {currentQuestion.choices.map((choice) => (
                  <label
                    key={choice.id}
                    className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedChoices.includes(choice.id)
                        ? 'bg-blue-50 border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type={currentQuestion.question_type === 'single' ? 'radio' : 'checkbox'}
                        checked={selectedChoices.includes(choice.id)}
                        onChange={() => handleChoiceToggle(choice.id)}
                        className="mt-1"
                      />
                      <span className="flex-1">{choice.text}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || selectedChoices.length === 0}
                  className="w-full"
                >
                  {submitting ? '採点中...' : '回答する'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
