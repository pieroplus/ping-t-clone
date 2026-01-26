'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  getTitle,
  ApiError,
  Title,
  getTitleFavorites,
  addTitleFavorite,
  removeTitleFavorite,
} from '@/lib/api';

export default function TitleDetailPage() {
  const params = useParams();
  const titleId = Number(params.id);
  const [title, setTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<number | null>(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    loadTitle();
    checkFavoriteStatus();
  }, [titleId]);

  const loadTitle = async () => {
    setLoading(true);
    try {
      const data = await getTitle(titleId);
      setTitle(data);

      // 所有者判定（フロント側の簡易チェック）
      const username = typeof window !== 'undefined' ? localStorage.getItem('username') : null;
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      setIsOwner(username === data.owner.username);
      setIsLoggedIn(!!token);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 403 || error.status === 404) {
          toast({
            title: 'アクセスエラー',
            description: 'このタイトルにアクセスする権限がありません',
            variant: 'destructive',
          });
          router.push('/titles');
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

  const checkFavoriteStatus = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    try {
      const favorites = await getTitleFavorites();
      const favorite = favorites.find((f) => f.title.id === titleId);
      if (favorite) {
        setIsFavorite(true);
        setFavoriteId(favorite.id);
      } else {
        setIsFavorite(false);
        setFavoriteId(null);
      }
    } catch (error) {
      // お気に入り状態の取得に失敗してもエラーは表示しない
    }
  };

  const handleToggleFavorite = async () => {
    if (!isLoggedIn) {
      toast({
        title: 'ログインが必要です',
        description: 'お気に入り機能を使用するにはログインしてください',
        variant: 'destructive',
      });
      return;
    }

    if (title?.status !== 'public') {
      toast({
        title: 'お気に入りに追加できません',
        description: '公開されているタイトルのみお気に入りに追加できます',
        variant: 'destructive',
      });
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorite && favoriteId) {
        // お気に入りを削除
        await removeTitleFavorite(favoriteId);
        setIsFavorite(false);
        setFavoriteId(null);
        toast({
          title: '削除しました',
          description: 'お気に入りから削除しました',
        });
      } else {
        // お気に入りに追加
        const newFavorite = await addTitleFavorite(titleId);
        setIsFavorite(true);
        setFavoriteId(newFavorite.id);
        toast({
          title: '追加しました',
          description: 'お気に入りに追加しました',
        });
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: 'エラー',
          description: error.message || 'お気に入りの操作に失敗しました',
          variant: 'destructive',
        });
      }
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!title) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>タイトルが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle>{title.name}</CardTitle>
                <CardDescription>作成者: {title.owner.username}</CardDescription>
              </div>
              {isLoggedIn && title.status === 'public' && (
                <Button
                  variant={isFavorite ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleToggleFavorite}
                  disabled={favoriteLoading}
                >
                  {favoriteLoading ? '...' : isFavorite ? '★ お気に入り' : '☆ お気に入り'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {title.description && (
              <div>
                <h3 className="font-semibold mb-2">説明</h3>
                <p className="text-gray-600">{title.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">問題数:</span> {title.questions_count}
              </div>
              <div>
                <span className="text-gray-600">ステータス:</span>{' '}
                {title.status === 'public'
                  ? '公開'
                  : title.status === 'private'
                  ? '非公開'
                  : '下書き'}
              </div>
              {title.average_rating && (
                <div>
                  <span className="text-gray-600">平均評価:</span> {title.average_rating.toFixed(1)}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
              <Link href={`/titles/${titleId}/solve?start=true`}>
                <Button>問題を解く</Button>
              </Link>
              <Link href={`/titles/${titleId}/solve?start=true&random=true`}>
                <Button variant="outline">ランダムに解く</Button>
              </Link>
              {isOwner && (
                <>
                  <Link href={`/titles/${titleId}/edit`}>
                    <Button variant="outline">編集</Button>
                  </Link>
                  <Link href={`/titles/${titleId}/questions/new`}>
                    <Button variant="outline">問題を追加</Button>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
