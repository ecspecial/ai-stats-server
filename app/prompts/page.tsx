"use client";

import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { Button, Spinner } from "@nextui-org/react";
import { useRouter } from 'next/navigation';
import styles from '@/styles/Stats.module.css';

interface Word {
  word: string;
  count: number;
}

const TopWordsList: NextPage = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchTopWords = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stats/getCommonPromptStats', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch top words');
      }

      const { topWords } = await response.json();
      setWords(topWords);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopWords();
  }, []);

  if (isLoading) {
    return <div className={styles.container}><Spinner /></div>;
  }

  if (error) {
    return <div className={styles.container}>Ошибка: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.navbar}>
        <Button
          color="primary"
          radius="sm"
          onPress={() => router.push('/images')}
        >
          Открыть статистику по картинкам
        </Button>
        <Button color="primary" radius="sm" onPress={() => router.push('/')}>
          Открыть общую статистику
        </Button>
        <Button color="primary" radius="sm" onPress={() => router.push('/users')}>
          Открыть статистику пользователей
        </Button>
      </div>
      <h1 className={styles.header}>Top 50 Words in Prompts</h1>

      {words.length === 0 ? (
        <p>No words found</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Word</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {words.map((word, index) => (
                <tr key={index}>
                  <td>{word.word}</td>
                  <td>{word.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TopWordsList;