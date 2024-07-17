"use client"

import { useEffect, useState } from 'react';
import { NextPage } from 'next';

import styles from '@/styles/Stats.module.css';

import { Button, Spinner } from "@nextui-org/react";

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
  proSubscriptionsCount: number;
  maxSubscriptionsCount: number;
  monthlySubscriptionsCount: number;
  annualSubscriptionsCount: number;
  currentSubscriptionsCount: number;
  todayNewPurchasesCount: number;
  nodaPaymentCount: number;
  cryptoPaymentCount: number;
  basicCardPaymentCount: number;
  todayCompletedPaymentsTotal: number;
  allTimeCompletedPaymentsTotal: number;
}

const Home: NextPage = () => {
  const [stats, setStats] = useState<StatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);


  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stats/getAllStats', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
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
      <Button color='primary' radius='sm' onPress={fetchStats}>
        {isLoading ? <Spinner color="default" size='sm' /> : 'Обновить данные'}
      </Button>
      {stats ? (
        <>
          <div className={styles.card}>Общее количество пользователей: {stats?.totalUsers}</div>
          <div className={styles.card}>Общее количество генераций: {stats?.totalGenerations}</div>
          <div className={styles.card}>Среднее количество генераций на пользователя: {stats?.avgGenerationsPerUser?.toFixed(2)}</div>
          <div className={styles.card}>Средний рейтинг по отзывам: {stats?.avgFeedbackRating ? parseFloat(stats.avgFeedbackRating).toFixed(2) : 'No data'}</div>
          <div className={styles.card}>Количество отзывов: {stats?.feedbackCount}</div>
          <div className={styles.card}>Количество пользователей зарегестрированных по реферальной программе: {stats?.refUsers}</div>


          <div className={styles.card}>Общее количество подписок Pro: {stats?.proSubscriptionsCount}</div>
          <div className={styles.card}>Общее количество подписок Max: {stats?.maxSubscriptionsCount}</div>
          <div className={styles.card}>Общее количество подписок купленных на месяц: {stats?.monthlySubscriptionsCount}</div>
          <div className={styles.card}>Общее количество подписок купленных на год: {stats?.annualSubscriptionsCount}</div>
          <div className={styles.card}>Общее количество активных подписок: {stats?.currentSubscriptionsCount}</div>
          <div className={styles.card}>Общее количество подписок купленных за сегодня: {stats?.todayNewPurchasesCount}</div>
          <div className={styles.card}>Общее количество подписок купленных через NODA: {stats?.nodaPaymentCount}</div>
          <div className={styles.card}>Общее количество подписок купленных через CRYPTO: {stats?.cryptoPaymentCount}</div>
          <div className={styles.card}>Общее количество подписок купленных через BASIC_CARD: {stats?.basicCardPaymentCount}</div>
          <div className={styles.card}>Общая сумма подписок купленных за сегодня, USD: {stats?.todayCompletedPaymentsTotal}</div>
          <div className={styles.card}>Общая сумма подписок купленных за все время, USD: {stats?.allTimeCompletedPaymentsTotal}</div>

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