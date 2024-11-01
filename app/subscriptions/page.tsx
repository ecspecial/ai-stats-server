"use client";

import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Card,
  Button,
} from '@nextui-org/react';
import styles from '@/styles/Stats.module.css';
import { useRouter } from 'next/navigation';

interface PaymentStats {
  totalPayments: number;
  paymentsByState: { _id: string; count: number }[];
  completedPaymentsByMethod: { _id: string; count: number }[];
  totalCompletedPaymentsAmount: number;
}

interface UserSubscription {
  _id: string;
  email: string;
  name: string;
  subscription: string;
  subscriptionEndDate?: string;
}

const SubscriptionStats: NextPage = () => {
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [users, setUsers] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch payment statistics
        const paymentResponse = await fetch('/api/payments/stats');
        const paymentData = await paymentResponse.json();

        if (!paymentResponse.ok) {
          throw new Error(paymentData.message || 'Error fetching payment statistics');
        }

        setPaymentStats(paymentData);

        // Fetch users with subscriptions
        const usersResponse = await fetch('/api/users/subscriptions');
        const usersData = await usersResponse.json();

        if (!usersResponse.ok) {
          throw new Error(usersData.message || 'Error fetching users with subscriptions');
        }

        if (!usersResponse.ok) {
            throw new Error(usersData.message || 'Error fetching users with subscriptions');
        }

        setUsers(usersData.activeUsers  || []);
        
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !paymentStats) {
    return <div>Error: {error || 'Failed to load data'}</div>;
  }

  return (
    <div className={styles.container}>
      {/* Navigation Buttons */}
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
        <Button color="primary" radius="sm" onPress={() => router.push('/prompts')}>
          Открыть статистику промптов
        </Button>
      </div>

      <h1>Подписки и Статистика пользователей</h1>

      {/* Display Payment Statistics */}
      <Card className={styles.card}>
        <h2 className='mb-2'>Статистика платежей</h2>
        <p className='mb-2'><strong>Всего платежей:</strong> {paymentStats.totalPayments}</p>
        <div className='mb-2'>
          <h3>Платежи по состоянию:</h3>
          <Table>
            <TableHeader>
              <TableColumn>Состояние</TableColumn>
              <TableColumn>Количество</TableColumn>
            </TableHeader>
            <TableBody>
              {paymentStats.paymentsByState.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{item._id}</TableCell>
                  <TableCell>{item.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className='mb-2'>
          <h3>Оплаченные платежи по методам оплаты:</h3>
          <Table>
            <TableHeader>
              <TableColumn>Метод оплаты</TableColumn>
              <TableColumn>Количество</TableColumn>
            </TableHeader>
            <TableBody>
              {paymentStats.completedPaymentsByMethod.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{item._id}</TableCell>
                  <TableCell>{item.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className='mb-2'><strong>Итоговая сумма оплаченных подписок:</strong> {paymentStats.totalCompletedPaymentsAmount}</p>
      </Card>

      {/* Display Users with Subscriptions */}
      <Card className={styles.card}>
        <h2>Пользователи с подписками</h2>
        <Table>
          <TableHeader>
            <TableColumn>User ID</TableColumn>
            <TableColumn>Имя</TableColumn>
            <TableColumn>Email</TableColumn>
            <TableColumn>Подписка</TableColumn>
            <TableColumn>Конец подписки</TableColumn>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user._id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.subscription}</TableCell>
                <TableCell>{user.subscriptionEndDate ? new Date(user.subscriptionEndDate).toLocaleDateString() : 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default SubscriptionStats;