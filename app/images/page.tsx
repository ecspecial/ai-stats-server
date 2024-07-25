"use client";

import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { Button, Spinner, Select, SelectItem } from "@nextui-org/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from '@/styles/Stats.module.css';
import { useRouter } from 'next/navigation';


interface ImageData {
  date: string;
  dayImageCount: number;
  imageTimeData: {
    timeGeneratedAt: string;
    timeGeneration: number;
    subscriptionType: string;
  }[];
}

interface ImageStatsResponse {
  totalImages: number;
  imageGenerationData: ImageData[];
}

const ImageStats: NextPage = () => {
  const [stats, setStats] = useState<ImageStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | undefined>(undefined);
  const [selectedSubscription, setSelectedSubscription] = useState<string>("All");

  const router = useRouter();

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stats/getImageStats', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
      setSelectedDay(data.imageGenerationData[0]?.date); // Set initial selected day
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDayChange = (value: string) => {
    setSelectedDay(value);
  };

  const handleSubscriptionChange = (value: string) => {
    setSelectedSubscription(value);
  };

  const filteredData = stats?.imageGenerationData
    .filter(data => selectedDay ? data.date === selectedDay : true)
    .map(data => ({
      ...data,
      imageTimeData: data.imageTimeData.filter(img => selectedSubscription === "All" || (selectedSubscription === "VIP" ? ["Pro", "Max"].includes(img.subscriptionType) : img.subscriptionType === selectedSubscription))
    }));

  const chartData = filteredData?.flatMap(data => data.imageTimeData.map(img => ({
    date: data.date,
    timeGeneratedAt: new Date(img.timeGeneratedAt).toLocaleTimeString(),
    timeGeneration: img.timeGeneration,
    subscriptionType: img.subscriptionType
  })));

  if (error) {
    return <div className={styles.card}>Error: {error}</div>;
  }

  return (
    <main className={styles.container}>
        <div className={styles.navbar}>
            <Button
            color="primary"
            radius="sm"
            onPress={() => router.push('/')}
            >
            Открыть общую статистику
        </Button>
      </div>
      <h1 className={styles.header}>{ `${'Статистика по генерации картиок [месяц]'}`}</h1>
      <Button color='primary' radius='sm' onPress={fetchStats}>
        {isLoading ? <Spinner color="default" size='sm' /> : 'Обновить данные'}
      </Button>

      {stats ? (
        <>
          <div className={styles.card}>Всего сгенерировано картинок: {stats.totalImages}</div>
          
          <div className={styles.card}>
            <Select 
              placeholder="Выбрать день"
              onChange={(e) => handleDayChange(e.target.value)}
              value={selectedDay ?? ""}
            >
              {stats.imageGenerationData.map((data) => (
                <SelectItem key={data.date} value={data.date}>
                  {data.date}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className={styles.card}>
            <Select 
              placeholder="Выбрать тип подписки"
              onChange={(e) => handleSubscriptionChange(e.target.value)}
              value={selectedSubscription}
            >
              <SelectItem key="All" value="All">All</SelectItem>
              <SelectItem key="Free" value="Free">Free</SelectItem>
              <SelectItem key="VIP" value="VIP">VIP (Pro & Max)</SelectItem>
            </Select>
          </div>

          <div className={styles.card}>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={chartData}
                margin={{
                  top: 5, right: 30, left: 20, bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timeGeneratedAt" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="timeGeneration" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div>Loading...</div>
      )}
    </main>
  );
};

export default ImageStats;