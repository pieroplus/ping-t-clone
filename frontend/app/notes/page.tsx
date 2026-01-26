'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  QuestionNote,
  getAllNotes,
  updateQuestionNote,
  deleteQuestionNote,
} from '@/lib/api';

export default function NotesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [notes, setNotes] = useState<QuestionNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNote, setEditingNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = await getAllNotes();
      setNotes(data);
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'メモの読み込みに失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (note: QuestionNote) => {
    setEditingNoteId(note.id);
    setEditingNote(note.note);
  };

  const handleEditCancel = () => {
    setEditingNoteId(null);
    setEditingNote('');
  };

  const handleUpdate = async (questionId: number) => {
    if (editingNote.trim() === '') {
      toast({
        title: 'エラー',
        description: 'メモを入力してください',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await updateQuestionNote(questionId, { note: editingNote });
      toast({
        title: '保存しました',
        description: 'メモを更新しました',
      });
      setEditingNoteId(null);
      setEditingNote('');
      loadNotes();
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'メモの更新に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (questionId: number) => {
    if (!confirm('メモを削除してもよろしいですか？')) return;

    setSaving(true);
    try {
      await deleteQuestionNote(questionId);
      toast({
        title: '削除しました',
        description: 'メモを削除しました',
      });
      loadNotes();
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'メモの削除に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleViewQuestion = (note: QuestionNote) => {
    if (note.question?.title) {
      router.push(`/titles/${note.question.title}`);
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
            <h1 className="text-3xl font-bold">マイメモ</h1>
            <p className="text-gray-600 mt-2">保存した問題メモの一覧</p>
          </div>

          {notes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500 mb-4">まだメモがありません</p>
                <Button onClick={() => router.push('/titles')}>
                  タイトル一覧へ
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <Card key={note.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          <span className="text-sm text-gray-500">
                            タイトルID: {note.question.title}
                          </span>
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          問題ID: {note.question.id}
                        </p>
                        {note.question.text && (
                          <p className="text-sm mt-2 line-clamp-2">
                            {note.question.text}
                          </p>
                        )}
                      </div>
                      {note.question.title && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewQuestion(note)}
                        >
                          問題を見る
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {editingNoteId === note.id ? (
                      <>
                        <Textarea
                          value={editingNote}
                          onChange={(e) => setEditingNote(e.target.value)}
                          className="min-h-25"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleUpdate(note.question.id)}
                            disabled={saving}
                          >
                            {saving ? '保存中...' : '保存'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleEditCancel}
                            disabled={saving}
                          >
                            キャンセル
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap text-sm">{note.note}</p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditStart(note)}
                          >
                            編集
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(note.question.id)}
                            disabled={saving}
                          >
                            削除
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
