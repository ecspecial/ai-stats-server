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
  const router = useRouter();

  const [searchEmail, setSearchEmail] = useState('');
  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('All');
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortOption, setSortOption] = useState('createdAt');

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
      console.log(data)
      console.log(users);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users
    .filter(user =>
      (searchEmail === '' || user.email.toLowerCase().includes(searchEmail.toLowerCase())) &&
      (searchId === '' || user._id.includes(searchId)) &&
      (searchName === '' || user.name.toLowerCase().includes(searchName.toLowerCase())) &&
      (subscriptionFilter === 'All' || user.subscription === subscriptionFilter) &&
      (activeFilter === 'All' || 
        (activeFilter === 'Active' && new Date(user.subscriptionEndDate || 0) > new Date()) || 
        (activeFilter === 'Overall' && user.subscriptionEndDate))
    )
    .sort((a, b) => {
      if (sortOption === 'createdAt') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortOption === 'updatedAt') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else if (sortOption === 'subscriptionEndDate') {
        return new Date(b.subscriptionEndDate || 0).getTime() - new Date(a.subscriptionEndDate || 0).getTime();
      }
      return 0;
    });


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

      <div className={styles.filters}>
        <Input
          placeholder="Поиск по Email"
          label="Поиск по Email"
          labelPlacement="outside"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className={styles.searchInput}
        />
        <Input
          label="Поиск по ID"
          labelPlacement="outside"
          placeholder="Поиск по ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className={styles.searchInput}
        />
        <Input
          label="Поиск по Name"
          labelPlacement="outside"
          placeholder="Поиск по Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className={styles.searchInput}
        />
        <Select
          label="Фильтр по подпискам"
          labelPlacement="outside"
          placeholder="Фильтр по подпискам"
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
          labelPlacement="outside"
          placeholder="Активные подписки/Все подписки"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
        >
          <SelectItem key="All" value="All">Все</SelectItem>
          <SelectItem key="Active" value="Active">Активные</SelectItem>
          <SelectItem key="Overall" value="Overall">Все подписки</SelectItem>
        </Select>
        <Select
          label="Сортировка по:"
          labelPlacement="outside"
          placeholder="Сортировка по:"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
        >
          <SelectItem key="createdAt" value="createdAt">Дате регистрации</SelectItem>
          <SelectItem key="updatedAt" value="updatedAt">Последнему обновлению в базе</SelectItem>
          <SelectItem key="subscriptionEndDate" value="subscriptionEndDate">Окончанию подписки</SelectItem>
        </Select>
      </div>

      {filteredUsers.length === 0 ? (
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
              {filteredUsers.map(user => (
                <tr key={user._id} onClick={() => handleClick(user._id)} className={styles.tableRow}>
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
    </div>
  );
};

export default UsersList;