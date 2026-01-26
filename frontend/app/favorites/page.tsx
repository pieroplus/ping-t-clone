'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  TitleFavorite,
  QuestionFavorite,
  getTitleFavorites,
  getQuestionFavorites,
  removeTitleFavorite,
  removeQuestionFavorite,
} from '@/lib/api';

export default function FavoritesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [titleFavorites, setTitleFavorites] = useState<TitleFavorite[]>([]);
  const [questionFavorites, setQuestionFavorites] = useState<QuestionFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'titles' | 'questions'>('titles');
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const [titles, questions] = await Promise.all([
        getTitleFavorites(),
        getQuestionFavorites(),
      ]);
      setTitleFavorites(titles);
      setQuestionFavorites(questions);
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'お気に入りの読み込みに失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTitleFavorite = async (favoriteId: number) => {
    if (!confirm('お気に入りから削除してもよろしいですか？')) return;

    setRemoving(true);
    try {
      await removeTitleFavorite(favoriteId);
      toast({
        title: '削除しました',
        description: 'お気に入りから削除しました',
      });
      loadFavorites();
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'お気に入りの削除に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setRemoving(false);
    }
  };

  const handleRemoveQuestionFavorite = async (favoriteId: number) => {
    if (!confirm('お気に入りから削除してもよろしいですか？')) return;

    setRemoving(true);
    try {
      await removeQuestionFavorite(favoriteId);
      toast({
        title: '削除しました',
        description: 'お気に入りから削除しました',
      });
      loadFavorites();
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'お気に入りの削除に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">お気に入り</h1>
            <p className="text-gray-600 mt-2">保存したタイトルと問題の一覧</p>
          </div>

          {/* タブ */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === 'titles' ? 'default' : 'outline'}
              onClick={() => setActiveTab('titles')}
            >
              タイトル ({titleFavorites.length})
            </Button>
            <Button
              variant={activeTab === 'questions' ? 'default' : 'outline'}
              onClick={() => setActiveTab('questions')}
            >
              問題 ({questionFavorites.length})
            </Button>
          </div>

          {/* タイトルのお気に入り */}
          {activeTab === 'titles' && (
            <>
              {titleFavorites.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500 mb-4">
                      まだお気に入りのタイトルがありません
                    </p>
                    <Button onClick={() => router.push('/titles')}>
                      タイトル一覧へ
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {titleFavorites.map((favorite) => (
                    <Card key={favorite.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle>{favorite.title.name}</CardTitle>
                            <CardDescription>
                              作成者: {favorite.title.owner.username}
                            </CardDescription>
                          </div>
                          <Link href={`/titles/${favorite.title.id}`}>
                            <Button variant="outline" size="sm">
                              詳細を見る
                            </Button>
                          </Link>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {favorite.title.description && (
                          <p className="text-sm text-gray-600">
                            {favorite.title.description}
                          </p>
                        )}
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>問題数: {favorite.title.questions_count}</span>
                          {favorite.title.average_rating && (
                            <span>
                              平均評価: {favorite.title.average_rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/titles/${favorite.title.id}/solve`}>
                            <Button size="sm">問題を解く</Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveTitleFavorite(favorite.id)}
                            disabled={removing}
                          >
                            削除
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* 問題のお気に入り */}
          {activeTab === 'questions' && (
            <>
              {questionFavorites.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500 mb-4">
                      まだお気に入りの問題がありません
                    </p>
                    <Button onClick={() => router.push('/titles')}>
                      タイトル一覧へ
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {questionFavorites.map((favorite) => (
                    <Card key={favorite.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-base">
                              <span className="text-sm text-gray-500">
                                タイトルID: {favorite.question.title_id}
                              </span>
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              問題ID: {favorite.question.id}
                            </p>
                          </div>
                          <Link href={`/titles/${favorite.question.title_id}`}>
                            <Button variant="outline" size="sm">
                              タイトルを見る
                            </Button>
                          </Link>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm">{favorite.question.text}</p>
                        <div className="text-sm text-gray-600">
                          {favorite.question.question_type === 'single'
                            ? '単一選択'
                            : '複数選択'}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveQuestionFavorite(favorite.id)}
                            disabled={removing}
                          >
                            削除
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
