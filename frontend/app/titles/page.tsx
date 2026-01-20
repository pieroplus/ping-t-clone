"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTitles, Title } from "@/lib/api";

export default function TitlesPage() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTitles();
  }, [page]);

  const loadTitles = async () => {
    setLoading(true);
    try {
      const response = await getTitles(page, pageSize);
      setTitles(response.results);
      setCount(response.count);
    } catch (error) {
      console.error("Failed to load titles:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(count / pageSize);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">タイトル一覧</h1>
          <Link href="/titles/new">
            <Button>新規作成</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8">読み込み中...</div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {titles.map((title) => (
                <Card
                  key={title.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <CardTitle>{title.name}</CardTitle>
                    <CardDescription>
                      作成者: {title.owner.username}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>問題数: {title.questions_count}</p>
                      {title.average_rating && (
                        <p>平均評価: {title.average_rating.toFixed(1)}</p>
                      )}
                      <p>ステータス: {title.status}</p>
                    </div>
                    <div className="mt-4 space-x-2">
                      <Link href={`/titles/${title.id}`}>
                        <Button>詳細を見る</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-4 mt-8">
                <Button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  variant="outline"
                >
                  前へ
                </Button>
                <span className="py-2 px-4">
                  {page} / {totalPages}
                </span>
                <Button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  variant="outline"
                >
                  次へ
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
