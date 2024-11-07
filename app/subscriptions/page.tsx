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
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { PaymentDocument } from '../lib/mongodb/models/payment';

import { Select, SelectItem } from '@nextui-org/react';

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

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const [payments, setPayments] = useState<PaymentDocument[]>([]);

  const [filterOption, setFilterOption] = useState<'Active' | 'All'>('All');

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

        console.log('paymentData', paymentData)
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

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const body: any = {
            filterOption,
          };
          if (startDate) {
            body.startDate = startDate.toISOString();
          }
          if (endDate) {
            body.endDate = endDate.toISOString();
          }

        const response = await fetch('/api/payments/by-date', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Error fetching payments by date');
        }

        setPayments(data.payments || []);
      } catch (error: any) {
        console.error('Error fetching payments:', error);
        setError(error.message);
      }
    };

    if (startDate || endDate) {
        fetchPayments();
    } else {
      // Clear payments if no dates are selected
      setPayments([]);
    }
  }, [startDate, endDate, filterOption]);

    // Function to calculate end time
  const calculateEndTime = (payment: PaymentDocument): string => {
    const createdAt = new Date(payment.createdAt);
    let endTime = new Date(createdAt);
    if (payment.annual) {
      endTime.setFullYear(endTime.getFullYear() + 1);
    } else {
      endTime.setMonth(endTime.getMonth() + 1);
    }
    return endTime.toLocaleDateString();
  };

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

      <Card className={styles.card}>
        <h2>Активных подписок: {`${users.length}`}</h2>
      </Card>

      {/* Display Users with Subscriptions */}
      <Card className={styles.card}>
        <h2>Пользователи с активными подписками</h2>
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

      <div className={styles.datesContainer}>
        <h2 className={styles.labelFilter}>Платежи по датам</h2>

        <div className={styles.datePickerContainer}>
            <label>
            Начальная дата:
            <DatePicker
                className={styles.datePickerDatePicker}
                selected={startDate}
                onChange={(date: Date | null, event?: React.SyntheticEvent<any>) => {
                    setStartDate(date || undefined);
                    console.log('Start Date changed:', date);
                }}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                dateFormat="dd/MM/yyyy"
                placeholderText="Выберите начальную дату"
            />
            </label>
            <label>
            Конечная дата:
            <DatePicker
                className={styles.datePickerDatePicker}
                selected={endDate}
                onChange={(date: Date | null, event?: React.SyntheticEvent<any>) => {
                    setEndDate(date || undefined);
                    console.log('End Date changed:', date);
                }}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                dateFormat="dd/MM/yyyy"
                placeholderText="Выберите конечную дату"
            />
            </label>
        </div>

        <label className={styles.labelFilter}>
                Фильтр:
                <Select
                placeholder="Выберите фильтр"
                selectedKeys={new Set([filterOption])}
                onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as 'Active' | 'All';
                    setFilterOption(value);
                }}
                >
                <SelectItem key="All" value="All">Все</SelectItem>
                <SelectItem key="Active" value="Active">Активные</SelectItem>
                </Select>
        </label>

        <Card className={styles.card}>
          {payments.length > 0 ? (
            <>
              <h2>Платежи</h2>
              <Table>
                <TableHeader>
                  <TableColumn>Payment ID</TableColumn>
                  <TableColumn>Payment Method</TableColumn>
                  <TableColumn>State</TableColumn>
                  <TableColumn>Amount</TableColumn>
                  <TableColumn>Annual</TableColumn>
                  <TableColumn>Subscription Type</TableColumn>
                  <TableColumn>End Time</TableColumn>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell>{payment.paymentId || payment._id}</TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell>{payment.state}</TableCell>
                      <TableCell>{payment.amount}</TableCell>
                      <TableCell>{payment.annual ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{payment.subscriptionType}</TableCell>
                      <TableCell>{calculateEndTime(payment)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <p>Нет платежей за выбранный период.</p>
          )}
        </Card>

    </div>

    </div>
  );
};

export default SubscriptionStats;