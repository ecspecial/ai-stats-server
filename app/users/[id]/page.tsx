"use client";

import { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { Button, Input, Select, SelectItem } from "@nextui-org/react";
import styles from '@/styles/Stats.module.css';
import { UserDocument } from '@/app/lib/mongodb/models/user';
import { ImageDocument } from '@/app/lib/mongodb/models/image';
import { useRouter, usePathname } from 'next/navigation';

const USER_IMAGES_URL = process.env.NEXT_PUBLIC_USER_IMAGES_URL!;

const UserDetail: NextPage = () => {
  const [user, setUser] = useState<UserDocument | null>(null);
  const [userImages, setUserImages] = useState<ImageDocument[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editSubscription, setEditSubscription] = useState<string>('');
  const [editCredits, setEditCredits] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showFavorites, setShowFavorites] = useState<'all' | 'favorites'>('all');

  const userId = usePathname().split('/').pop();

  useEffect(() => {
    if (userId) {
      const fetchUser = async () => {
        try {
          const response = await fetch(`/api/users/${userId}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Error fetching user data');
          }

          setUser(data.user);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setLoading(false);
        }
      };

      fetchUser();
    }
  }, [userId]);

  useEffect(() => {
    if (user) {
      setEditSubscription(user.subscription);
      setEditCredits(user.credits.valueOf()); // Convert Number to number
    }
  }, [user]);

  useEffect(() => {
    if (userId) {
      const fetchImages = async () => {
        try {
          const response = await fetch('/api/users/images/v2/get', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId })
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Error fetching user images');
          }

          const sortedImages = data.images.sort((a: ImageDocument, b: ImageDocument) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setUserImages(sortedImages);
          setFilteredImages(sortedImages);
        } catch (error) {
          console.error('Error fetching user images:', error);
        }
      };

      fetchImages();
    }
  }, [userId]);

  const handleDeleteUser = async () => {
    const isConfirmed = confirm('Are you sure you want to delete this user? This action cannot be undone.');

    if (isConfirmed) {
      setIsDeleting(true);
      try {
        const response = await fetch(`/api/users/delete/${userId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Error deleting user');
        }

        // Redirect to the user list or home page after deletion
        router.push('/users');
      } catch (error) {
        console.error('Error deleting user:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSaveChanges = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/users/update/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: editSubscription,
          credits: editCredits,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error updating user');
      }

      // Update the user state with the new data
      setUser(data.user);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user');
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    let images = [...userImages];

    // Filter by favorites
    if (showFavorites === 'favorites' && user) {
      images = images.filter(image =>
        image.res_image && user.favorites.includes(image.res_image)
      );
    }

    // Sort by date
    if (sortOrder === 'newest') {
      images.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortOrder === 'oldest') {
      images.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    setFilteredImages(images);
  }, [userImages, sortOrder, showFavorites, user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !user) {
    return <div>Error: {error || 'User not found'}</div>;
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
        <Button color="primary" radius="sm" onPress={() => router.push('/prompts')}>
          Открыть статистику промптов
        </Button>
      </div>
      <h1>User Details</h1>
      <div className={styles.card}>
        <p><strong>User ID:</strong> {user._id}</p>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>

        {isEditing ? (
          <div>
            <label>
              <strong>Subscription:</strong>
              <Select
                value={editSubscription}
                onChange={(e) => setEditSubscription(e.target.value)}
                placeholder="Select Subscription"
                labelPlacement="outside"
              >
                <SelectItem key="Free" value="Free">Free</SelectItem>
                <SelectItem key="Pro" value="Pro">Pro</SelectItem>
                <SelectItem key="Max" value="Max">Max</SelectItem>
              </Select>
            </label>
            <br />
            <label>
              <strong>Credits:</strong>
              <Input
                type="number"
                value={editCredits.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  if (typeof value === 'string') {
                    setEditCredits(Number(value));
                  }
                }}
              />
            </label>
            <br />
            <button
              className={`${styles.changesButton}`}
              onClick={handleSaveChanges}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <>
            <p><strong>Subscription:</strong> {user.subscription}</p>
            <p><strong>Credits:</strong> {user.credits.toString()}</p>
          </>
        )}

        <p><strong>Subscription End Date:</strong> {user.subscriptionEndDate ? new Date(user.subscriptionEndDate).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Registration Date:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
        <p><strong>Last Updated:</strong> {new Date(user.updatedAt).toLocaleDateString()}</p>
        <p><strong>Referral Code:</strong> {user.referralCode}</p>
        <p><strong>Referred By:</strong> {user.referredBy || 'N/A'}</p>
        <p><strong>Referred By Time:</strong> {user.referredByTime ? new Date(user.referredByTime).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Referred Users:</strong> {user.referrals.length > 0 ? user.referrals.join(', ') : 'None'}</p>
        <p><strong>Visited Socials:</strong> {user.visitedSocials.join(', ') || 'None'}</p>
        <p><strong>Feedback Submitted:</strong> {user.feedbackSubmitted ? 'Yes' : 'No'}</p>
        <p><strong>Feedback Rating:</strong> {user.feedbackRating?.toString() || 'N/A'}</p>
        <p><strong>Service Modal Shown:</strong> {user.serviceModalShown ? 'Yes' : 'No'}</p>
        <p><strong>Gallery:</strong> <a href={`/gallery/${user._id}`} target="_blank">View Gallery</a></p>
        <button
          className={styles.deleteButton}
          onClick={handleDeleteUser}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete User'}
        </button>
        <button
          className={`${!isEditing ? styles.updateButton : ''} ${isEditing ? styles.updateButton_active : ''}`}
          onClick={() => 
            {
              setIsEditing(!isEditing)
          }
          }
        >
          {isEditing ? 'Cancel Changes' : 'Update User'}
        </button>
      </div>

      {userImages.length > 0 && (
        <div className={styles.imageGallery}>
          <h2>Картинки пользователя</h2>
          <div className={styles.filterControls}>
            <Select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              placeholder="Фильтр по дате генерации"
              label="Фильтр по дате генерации"
              labelPlacement="outside"
            >
              <SelectItem key="newest" value="newest">Сначала новые</SelectItem>
              <SelectItem key="oldest" value="oldest">Сначала старые</SelectItem>
            </Select>
            <Select
              value={showFavorites}
              onChange={(e) => setShowFavorites(e.target.value as 'all' | 'favorites')}
              placeholder="Фильтр по любимым"
              label="Фильтр по любимым"
              labelPlacement="outside"
            >
              <SelectItem key="all" value="all">Все картинки</SelectItem>
              <SelectItem key="favorites" value="favorites">Любимые</SelectItem>
            </Select>
          </div>
          <div className={styles.imageGrid}>
            {filteredImages.map(image => (
              <div key={image._id} className={styles.imageCard}>
                <img src={`${USER_IMAGES_URL}${image.res_image}`} alt={`Generated image by ${user?.name}`} />
                <p><strong>Prompt:</strong> {image.prompt}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetail;