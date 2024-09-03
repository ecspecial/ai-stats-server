"use client";

import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { Button, Spinner } from "@nextui-org/react";
import { useRouter } from 'next/navigation';
import styles from '@/styles/Stats.module.css';

interface User {
  _id: string;
  name: string;
  email: string;
}

const UsersList: NextPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (isLoading) {
    return <div className={styles.container}><Spinner /></div>;
  }

  if (error) {
    return <div className={styles.container}>Ошибка: {error}</div>;
  }

  const handleClick = (id: string) => {
    // Navigate to the user details page and pass the user object as a query parameter
    router.push(`/users/${id}`);
  };

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
      </div>
      <h1 className={styles.header}>Список пользователей</h1>
      {users.length === 0 ? (
        <p>Пользователи не найдены</p>
      ) : (
        <div className={styles.grid}>
          {users.map(user => (
            <div key={user._id} className={styles.card} onClick={() => {handleClick(user._id)}}>
              <p><strong>ID:</strong> {user._id}</p>
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
          ))}
        </div>
        )}
    </div>
  );
};

export default UsersList;