'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { getTitle, ApiError, Title } from '@/lib/api';

export default function TitleDetailPage() {
  const params = useParams();
  const titleId = Number(params.id);
  const [title, setTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    loadTitle();
  }, [titleId]);

  const loadTitle = async () => {
    setLoading(true);
    try {
      const data = await getTitle(titleId);
      setTitle(data);

      // 所有者判定（フロント側の簡易チェック）
      const username = typeof window !== 'undefined' ? localStorage.getItem('username') : null;
      setIsOwner(username === data.owner.username);
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
            <CardTitle>{title.name}</CardTitle>
            <CardDescription>作成者: {title.owner.username}</CardDescription>
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
              <Link href={`/titles/${titleId}/solve`}>
                <Button>問題を解く</Button>
              </Link>
              <Link href={`/titles/${titleId}/solve?random=true`}>
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
