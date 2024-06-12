"use client"

import { useEffect, useState } from 'react';
import { NextPage } from 'next';

import styles from '@/styles/Stats.module.css';

interface Stat {
  date: string;
  amount: number;
}

interface FeedbackDetail {
  date: string;
  feedbacks: {
    date: string;
    feedbackRating: number;
    feedback1: string;
    feedback2: string;
  }[];
}

interface StatResponse {
  totalUsers: number;
  usersPerDay: Stat[];
  refUsers: number;
  refUsersPerDay: Stat[];
  totalGenerations: number;
  avgGenerationsPerUser: number;
  generationsPerDay: { date: string; amount: number; avgPerUser: number }[];
  avgFeedbackRating: string | null;
  feedbackCount: number;
  feedbackRatingsPerDay: { date: string; averageRating: number | null; count: number }[];
  feedbackDetailsPerDay: FeedbackDetail[];
  onlineUsersPerDay: Stat[];
  avgImagesPerOnlineUserPerDay: { date: string; average: number }[];
}

const Home: NextPage = () => {
  const [stats, setStats] = useState<StatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats/getAllStats', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      console.log('data', data.stats)
      setStats(data.stats);
      console.log("stats?.avgFeedbackRating", stats?.avgFeedbackRating)
    } catch (error: any) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (error) {
    return <div className={styles.card}>Error: {error}</div>;
  }

  return (
    <main className={styles.container}>
      <h1  className={styles.header}>{ `${'Статистика [месяц]'}`}</h1>
      <button className={styles.refetchButton} onClick={fetchStats}>Обновить данные</button>
      {stats ? (
        <>
          <div className={styles.card}>Общее количество пользователей: {stats?.totalUsers}</div>
          <div className={styles.card}>Общее количество генераций: {stats?.totalGenerations}</div>
          <div className={styles.card}>Среднее количество генераций на пользователя: {stats?.avgGenerationsPerUser?.toFixed(2)}</div>
          <div className={styles.card}>Средний рейтинг по отзывам: {stats?.avgFeedbackRating ? parseFloat(stats.avgFeedbackRating).toFixed(2) : 'No data'}</div>
          <div className={styles.card}>Количество отзывов: {stats?.feedbackCount}</div>
          <div className={styles.card}>Количество пользователей зарегестрированных по реферальной программе: {stats?.refUsers}</div>

          <div className={styles.card}>
            <h2 className={styles.card_header}>Количество пользователей по дням</h2>
            {stats?.usersPerDay?.map((stat) => (
              <div key={stat.date}>
                {stat.date}: {stat.amount}
              </div>
            ))}
          </div>

          <div className={styles.card}>
            <h2 className={styles.card_header}>Количество генераций по дням</h2>
            {stats?.generationsPerDay?.map((stat) => (
              <div key={stat.date}>
                {stat.date}: {stat.amount} (Среднее на пользователя: {stat.avgPerUser})
              </div>
            ))}
          </div>

          <div className={styles.card}>
            <h2 className={styles.card_header}>Количество пользователей зарегестрированных по реферальной программе по дням</h2>
            {stats?.refUsersPerDay?.map((stat) => (
              <div key={stat.date}>
                {stat.date}: {stat.amount}
              </div>
            ))}
          </div>

          <div className={styles.card}>
            <h2 className={styles.card_header}>Количество онлайн пользователей по дням</h2>
            {stats?.onlineUsersPerDay?.map((stat) => (
              <div key={stat.date}>
                {stat.date}: {stat.amount}
              </div>
            ))}            
          </div>

          <div className={styles.card}>
            <h2 className={styles.card_header}>Среднее количество генераций на онлайн пользователя по дням</h2>
            {stats?.avgImagesPerOnlineUserPerDay?.map((stat) => (
              <div key={stat.date}>
                {stat.date}: {stat.average}
              </div>
            ))}
          </div>

          <div className={styles.card}>
          <h2 className={styles.card_header}>Рейтинг отзывов по дням</h2>
            {stats?.feedbackRatingsPerDay?.map((stat) => (
              <div key={stat.date}>
                {stat.date}: Средний рейтинг: {stat.averageRating ?? 'No data'} (Количество отзывов: {stat.count})
              </div>
            ))}
          </div>

          <div className={styles.card}>
            <h2 className={styles.card_header}>Детали отзывов по дням</h2>
            {stats?.feedbackDetailsPerDay?.map((detail) => (
              <div key={detail.date}>
                <h3>{detail.date}</h3>
                {detail.feedbacks?.map((feedback, index) => (
                  <div key={index}>
                    Рейтинг: {feedback.feedbackRating}, Feedback1: {feedback.feedback1}, Feedback2: {feedback.feedback2}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div >Загрузка...</div>
      )}
    </main>
  );
};

export default Home;