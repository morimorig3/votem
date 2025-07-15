'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRoom } from '@/service/roomService';
import CreateRoomScreen from '@/components/CreateRoomScreen';
import RoomCreatedScreen from '@/components/RoomCreatedScreen';
import { useError } from '@/hooks/useError';

export default function CreateRoom() {
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<{
    id: string;
    url: string;
    title: string;
  } | null>(null);

  const { error, setError, clearError, handleError } = useError();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('タイトルを入力してください');
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const data = await createRoom(title.trim());

      setCreatedRoom({
        id: data.room.id,
        url: data.url,
        title: data.room.title,
      });
    } catch (error) {
      handleError(error, 'ルームの作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!createdRoom) return;

    try {
      await navigator.clipboard.writeText(createdRoom.url);
      alert('URLをクリップボードにコピーしました');
    } catch {
      alert('コピーに失敗しました。URLを手動でコピーしてください');
    }
  };

  const goToRoom = () => {
    if (createdRoom) {
      router.push(`/rooms/${createdRoom.id}`);
    }
  };

  return createdRoom ? (
    <RoomCreatedScreen
      createdRoom={createdRoom}
      onCopyToClipboard={copyToClipboard}
      onGoToRoom={goToRoom}
    />
  ) : (
    <CreateRoomScreen
      title={title}
      onTitleChange={setTitle}
      onSubmit={handleSubmit}
      error={error}
      isLoading={isLoading}
    />
  );
}
