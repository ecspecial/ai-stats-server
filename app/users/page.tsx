"use client";

import React, { useEffect, useState, ChangeEvent } from 'react';
import { NextPage } from 'next';
import { Button, Input, Select, SelectItem, Spinner } from "@nextui-org/react";
import { useRouter } from 'next/navigation';
import styles from '@/styles/Stats.module.css';
import { UserDocument } from '../lib/mongodb/models/user';

const UsersList: NextPage = () => {
  const [users, setUsers] = useState<UserDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchEmail, setSearchEmail] = useState('');
  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('All');
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortOption, setSortOption] = useState('createdAt');

  const router = useRouter();

  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = {
        searchEmail,
        searchId,
        searchName,
        subscriptionFilter,
        activeFilter,
        sortOption,
        page: page.toString(),
      };

      const response = await fetch(`/api/users?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)

      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const { users, totalUsers } = await response.json();
      setUsers(users);
      setTotalPages(Math.ceil(totalUsers / 100)); // Assuming 100 users per page
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleFetchFilteredUsers = () => {
    fetchUsers(1); // Reset to page 1 when fetching new data
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchUsers(page);
  };

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
        <Button color="primary" radius="sm" onPress={() => router.push('/prompts')}>
          Открыть статистику промптов
        </Button>
        <Button color="primary" radius="sm" onPress={() => router.push('/gallery')}>
          Галерея
        </Button>
      </div>
      <h1 className={styles.header}>Список пользователей</h1>

      {/* Filters */}
      <div className={styles.filters}>
        <Input
          placeholder="Поиск по Email"
          label="Поиск по Email"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
        />
        <Input
          placeholder="Поиск по ID"
          label="Поиск по ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />
        <Input
          placeholder="Поиск по Name"
          label="Поиск по Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <Select
          label="Фильтр по подпискам"
          value={subscriptionFilter}
          onChange={(e) => setSubscriptionFilter(e.target.value)}
        >
          <SelectItem key="All" value="All">All</SelectItem>
          <SelectItem key="Free" value="Free">Free</SelectItem>
          <SelectItem key="Pro" value="Pro">Pro</SelectItem>
          <SelectItem key="Max" value="Max">Max</SelectItem>
        </Select>
        <Select
          label="Активные подписки/Все подписки"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
        >
          <SelectItem key="All" value="All">Все</SelectItem>
          <SelectItem key="Active" value="Active">Активные</SelectItem>
          <SelectItem key="Overall" value="Overall">Все подписки</SelectItem>
        </Select>
        <Select
          label="Сортировка по:"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
        >
          <SelectItem key="createdAt" value="createdAt">Дате регистрации</SelectItem>
          <SelectItem key="updatedAt" value="updatedAt">Последнему обновлению</SelectItem>
          <SelectItem key="subscriptionEndDate" value="subscriptionEndDate">Окончанию подписки</SelectItem>
        </Select>
        <Button onPress={handleFetchFilteredUsers}>Получить список пользователей</Button>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <p>Пользователи не найдены</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя</th>
                <th>Email</th>
                <th>Тариф</th>
                <th>Коины</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} onClick={() => router.push(`/users/${user._id}`)}>
                  <td>{user._id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.subscription}</td>
                  <td>{user.credits !== undefined && user.credits !== null ? user.credits.toString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    <div className={styles.card}>
      <Select
        placeholder="Выбрать страницу"
        onChange={(e) => handlePageChange(Number(e.target.value))}
        value={currentPage.toString()}
      >
        {Array.from({ length: totalPages }).map((_, index) => (
          <SelectItem key={index + 1} value={(index + 1).toString()}>
            Страница {index + 1}
          </SelectItem>
        ))}
      </Select>
    </div>
    </div>
  );
};

export default UsersList;