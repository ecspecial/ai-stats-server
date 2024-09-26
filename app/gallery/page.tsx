"use client";

import React, { useEffect, useState, ChangeEvent } from 'react';
import { Button, Input, Spinner, Select, SelectItem } from "@nextui-org/react";
import styles from '@/styles/Stats.module.css';

const USER_IMAGES_URL = process.env.NEXT_PUBLIC_USER_IMAGES_URL!;

interface ImageData {
  _id: string;
  prompt: string;
  res_image: string;
}

const ImageList: React.FC = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchPrompt, setSearchPrompt] = useState('');
  const [tempPrompt, setTempPrompt] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]); // To track selected images
  const [isSelecting, setIsSelecting] = useState(false); // To toggle selecting mode

  const pageSize = 100;

  const fetchImages = async (page = 1, promptSearch = '') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, promptSearch })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }

      const { images, totalImages } = await response.json();
      setImages(images);
      setTotalPages(Math.ceil(totalImages / pageSize));
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages(currentPage, searchPrompt);
  }, [currentPage]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTempPrompt(event.target.value);
  };

  const handleSearchSubmit = () => {
    setSearchPrompt(tempPrompt);
    setCurrentPage(1);
    fetchImages(1, tempPrompt);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const toggleSelecting = () => {
    setIsSelecting((prevState) => !prevState);
    setSelectedImages([]); // Reset selected images when toggling
  };

  const handleImageSelect = (imageId: string) => {
    if (selectedImages.includes(imageId)) {
      setSelectedImages(selectedImages.filter((id) => id !== imageId));
    } else {
      setSelectedImages([...selectedImages, imageId]);
    }
  };

  const handleAddToGallery = async () => {
    try {
      await Promise.all(
        selectedImages.map(async (imageId) => {
          const response = await fetch('/api/images/galleryAdd', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageId })
          });
          if (!response.ok) {
            throw new Error('Failed to add image to shared gallery');
          }
        })
      );
      alert('Images added to the shared gallery successfully');
      setSelectedImages([]); // Clear selection after the request
      setIsSelecting(false); // Exit selecting mode
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (isLoading) {
    return <div className={styles.container}><Spinner /></div>;
  }

  if (error) {
    return <div className={styles.container}>Ошибка: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <h1>Список картинок</h1>

      {/* Search Input with Button */}
      <div className={styles.searchContainer}>
        <Input
          placeholder="Поиск по промптам"
          value={tempPrompt}
          onChange={handleSearchChange}
        />
        <Button onClick={handleSearchSubmit}>Поиск</Button>
      </div>

      {/* Toggle selecting mode */}
      <Button onClick={toggleSelecting}>
        {isSelecting ? 'Отменить выбор картинок' : 'Выбрать картинки для общей галереи'}
      </Button>

      {/* Show button to add to shared gallery only if there are selected images */}
      {selectedImages.length > 0 && (
        <Button onClick={handleAddToGallery}>Разрешить использование в общей галерее</Button>
      )}

      {/* Images Grid */}
      {images.length === 0 ? (
        <p>Картинки не найдены</p>
      ) : (
        <div className={styles.imageGrid}>
          {images.map(image => (
            <div
              key={image._id}
              className={`${styles.imageCard} ${selectedImages.includes(image._id) ? styles.selected : ''}`}
              onClick={isSelecting ? () => handleImageSelect(image._id) : undefined}
              style={{ cursor: isSelecting ? 'pointer' : 'default', border: selectedImages.includes(image._id) ? '2px solid blue' : 'none' }}
            >
              <img src={`${USER_IMAGES_URL}${image.res_image}`} alt={image.prompt} />
              <p><strong>Prompt:</strong> {image.prompt}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
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

export default ImageList;