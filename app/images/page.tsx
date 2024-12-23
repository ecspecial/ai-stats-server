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
  subscriptionGenerationData: {
    Free: { date: string; averageTime: string; imageCount: number }[];
    Pro: { date: string; averageTime: string; imageCount: number }[];
    Max: { date: string; averageTime: string; imageCount: number }[];
  };
  overallTimeGenerationData: { date: string; totalTime: string }[];
}

const ImageStats: NextPage = () => {
  const [stats, setStats] = useState<ImageStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | undefined>(undefined);
  const [selectedSubscription, setSelectedSubscription] = useState<string>("All");
  const [selectedOverallSubscription, setSelectedOverallSubscription] = useState<string>("All");
  const [overallChartData, setOverallChartData] = useState<{ date: string; totalTime: number }[]>([]);
  const [selectedOverallDay, setSelectedOverallDay] = useState<string>("All");

  const [selectedOverallStartDay, setSelectedOverallStartDay] = useState<string>("All");
  const [selectedOverallEndDay, setSelectedOverallEndDay] = useState<string>("All");

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
      setSelectedDay(data.imageGenerationData[0]?.date);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (stats) {
      let data: { date: string; totalTime: number }[] = [];
      if (selectedOverallSubscription === "All") {
        data = stats.overallTimeGenerationData.map(item => ({
          date: item.date,
          totalTime: parseFloat(item.totalTime)
        }));
      } else if (["Free", "Pro", "Max"].includes(selectedOverallSubscription)) {
        const subscriptionType = selectedOverallSubscription as keyof typeof stats.subscriptionGenerationData;
        const subscriptionData = stats.subscriptionGenerationData[subscriptionType];
        data = subscriptionData.map(item => ({
          date: item.date,
          totalTime: parseFloat(item.averageTime)
        }));
      }
      setOverallChartData(data);
    }
  }, [selectedOverallSubscription, stats]);

  const handleDayChange = (value: string) => {
    setSelectedDay(value);
  };

  const handleSubscriptionChange = (value: string) => {
    setSelectedSubscription(value);
  };

  const handleOverallSubscriptionChange = (value: string) => {
    setSelectedOverallSubscription(value);
  };

  const handleOverallDayChange = (value: string) => {
    setSelectedOverallDay(value);
  };

  const handleResetOverallDay = () => {
    setSelectedOverallStartDay("All");
    setSelectedOverallEndDay("All");
    setSelectedOverallDay("All");
  };

  const filteredData = stats?.imageGenerationData
    .filter(data => selectedDay ? data.date === selectedDay : true)
    .map(data => ({
      ...data,
      imageTimeData: (data.imageTimeData ?? []).filter(img => selectedSubscription === "All" || (selectedSubscription === "VIP" ? ["Pro", "Max"].includes(img.subscriptionType) : img.subscriptionType === selectedSubscription))
    }));

  const chartData = filteredData?.flatMap(data => data.imageTimeData.map(img => ({
    date: data.date,
    timeGeneratedAt: new Date(img.timeGeneratedAt).toLocaleTimeString(),
    timeGeneration: img.timeGeneration,
    subscriptionType: img.subscriptionType
  })));

  const overallFilteredData = overallChartData.filter(data => {
    const dataDate = new Date(data.date);
    const startDate = selectedOverallStartDay !== "All" ? new Date(selectedOverallStartDay) : null;
    const endDate = selectedOverallEndDay !== "All" ? new Date(selectedOverallEndDay) : null;
  
    if (startDate && endDate) {
      return dataDate >= startDate && dataDate <= endDate;
    } else if (startDate) {
      return dataDate >= startDate;
    } else if (selectedOverallDay !== "All") {
      return data.date === selectedOverallDay;
    } else {
      return true;
    }
  });
  
  if (error) {
    return <div className={styles.card}>Error: {error}</div>;
  }

  return (
    <main className={styles.container}>
      <div className={styles.navbar}>
        <Button color="primary" radius="sm" onPress={() => router.push('/')}>
          Открыть общую статистику
        </Button>
        <Button color="primary" radius="sm" onPress={() => router.push('/users')}>
          Открыть статистику пользователей
        </Button>
        <Button color="primary" radius="sm" onPress={() => router.push('/prompts')}>
          Открыть статистику промптов
        </Button>
        <Button color="primary" radius="sm" onPress={() => router.push('/gallery')}>
          Галерея
        </Button>
        <Button color="primary" radius="sm" onPress={() => router.push('/subscriptions')}>
          Подписки
        </Button>
      </div>
      <h1 className={styles.header}>{`${'Статистика по генерации картинок [месяц]'}`}</h1>
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
            <p className="text-center mt-4">Время генерации указано в секундах</p>
          </div>

          <div className={styles.card}>
            <Select 
              placeholder="Выбрать начальную дату"
              onChange={(e) => setSelectedOverallStartDay(e.target.value)}
              value={selectedOverallStartDay ?? ""}
            >
              {stats.overallTimeGenerationData.map((data) => (
                <SelectItem key={data.date} value={data.date}>
                  {data.date}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className={styles.card}>
            <Select 
              placeholder="Выбрать конечную дату"
              onChange={(e) => setSelectedOverallEndDay(e.target.value)}
              value={selectedOverallEndDay ?? ""}
            >
              {stats.overallTimeGenerationData.map((data) => (
                <SelectItem key={data.date} value={data.date}>
                  {data.date}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className={styles.card}>
            <Select 
              placeholder="Выбрать тип подписки для общего времени"
              onChange={(e) => handleOverallSubscriptionChange(e.target.value)}
              value={selectedOverallSubscription}
            >
              <SelectItem key="All" value="All">All</SelectItem>
              <SelectItem key="Free" value="Free">Free</SelectItem>
              <SelectItem key="Pro" value="Pro">Pro</SelectItem>
              <SelectItem key="Max" value="Max">Max</SelectItem>
            </Select>
          </div>

          {/* <Button fullWidth color="secondary" radius="sm" onPress={handleResetOverallDay}>
              Показать все даты
          </Button> */}

          <div className={styles.card}>
            <h2>Общее время генерации по дням</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={overallFilteredData}
                margin={{
                  top: 5, right: 30, left: 20, bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="totalTime" stroke="#82ca9d" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-center mt-4">Общее время генерации указано в секундах</p>
          </div>
        </>
      ) : (
        <div>Loading...</div>
      )}
    </main>
  );
};

export default ImageStats;