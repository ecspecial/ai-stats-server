"use client";

import React, { useEffect, useState, ChangeEvent } from "react";
import { Button, Input, Spinner, Select, SelectItem, Tabs, Tab } from "@nextui-org/react";
import {Card, CardBody, CardFooter, Image} from "@nextui-org/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/react";
import { ImageDocument as ImageData } from "../lib/mongodb/models/image";
import styles from "@/styles/Stats.module.css";

const USER_IMAGES_URL = process.env.NEXT_PUBLIC_USER_IMAGES_URL!;

const ImageList: React.FC = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchPrompt, setSearchPrompt] = useState("");
  const [tempPrompt, setTempPrompt] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("notInGallery");
  const [isEditingLikes, setIsEditingLikes] = useState(false);
  const [likes, setLikes] = useState<number | null>(null);
  const [category, setCategory] = useState<string>("");

  const handleLikesChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLikes(Number(event.target.value));
  };

  const toggleEditLikes = () => {
    setIsEditingLikes(!isEditingLikes);
    if (!isEditingLikes && selectedImage) {
      setLikes(selectedImage.gallery_image_likes || 0); // Reset likes if canceled
    }
  };

  const pageSize = 100;

  const fetchImages = async (page = 1, promptSearch = "", tab = activeTab) => {
    setIsLoading(true);
    setError(null);

    const route = tab === "notInGallery" ? "/api/images/notInGallery" : "/api/images/inGallery";

    try {
      const response = await fetch(route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, promptSearch }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch images");
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

  // Fetch images on initial load
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
          const response = await fetch("/api/images/galleryAdd", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageId }),
          });
          if (!response.ok) {
            throw new Error("Failed to add image to shared gallery");
          }
        })
      );
      alert("Images added to the shared gallery successfully");
      setSelectedImages([]); // Clear selection after the request
      setIsSelecting(false); // Exit selecting mode
      fetchImages(1, "");
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteFromGallery = async () => {
    try {
      await Promise.all(
        selectedImages.map(async (imageId) => {
          const response = await fetch("/api/images/galleryRemove", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageId }),
          });
          if (!response.ok) {
            throw new Error("Failed to remove image from shared gallery");
          }
        })
      );
      alert("Images removed from the shared gallery successfully");
      setSelectedImages([]); // Clear selection after the request
      setIsSelecting(false); // Exit selecting mode
      fetchImages(1, ""); // Refresh the images
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleTabChange = (key: React.Key) => {
    setActiveTab(String(key));
    setCurrentPage(1); // Reset to page 1 when switching tabs
    setSearchPrompt(""); // Clear search prompt when switching tabs
    fetchImages(1, "", String(key)); // Fetch images based on the new tab
  };

  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);


  const openModalWithImage = (image: ImageData) => {
    setSelectedImage(image);
    setLikes(image.gallery_image_likes || 0);
    setCategory(image.category || "Photography");
    openImageModal();
  };

  const handleUpdateImage = async () => {
    if (selectedImage && likes !== null && category) {
      try {
        const response = await fetch("/api/images/updateGalleryData", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageId: selectedImage._id,
            likes,
            category,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update image data");
        }

        alert("Image data updated successfully");
        closeModal(); // Close the modal after a successful update
        fetchImages(currentPage, searchPrompt); // Refresh images list
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const {
      isOpen: isImagetModalOpen,
      onOpen: openImageModal,
      onClose: closeModal
  } = useDisclosure();

  const closeImageModal = () => {
		closeModal();
	};

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <div className={styles.container}>Ошибка: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <h1>Список картинок</h1>

      {/* Tabs to switch between Gallery/Non-Gallery images */}
      <Tabs variant="underlined" className={styles.galleryTabs} selectedKey={activeTab} onSelectionChange={handleTabChange}>
        <Tab key="notInGallery" title="Картинки не в галерее" />
        <Tab key="inGallery" title="Картинки в галерее" />
      </Tabs>

      {/* Search Input */}
      <div className={styles.searchContainer}>
        <Input placeholder="Поиск по промптам" value={tempPrompt} onChange={handleSearchChange} />
        <Button onClick={handleSearchSubmit}>Поиск</Button>
      </div>

      {/* Toggle selecting mode */}
      <Button className={styles.galleryImageButtons} onClick={toggleSelecting}>
        {isSelecting
          ? activeTab === "notInGallery"
            ? "Отменить выбор картинок"
            : "Отменить выбор картинок для удаления"
          : activeTab === "notInGallery"
          ? "Выбрать картинки для общей галереи"
          : "Выбрать картинки для удаления из общей галереи"}
      </Button>

      {/* Conditionally render based on the active tab */}
      {selectedImages.length > 0 && (
        <Button
          color={activeTab === "notInGallery" ? "success" : "danger"}
          onClick={activeTab === "notInGallery" ? handleAddToGallery : handleDeleteFromGallery}
        >
          {activeTab === "notInGallery"
            ? "Разрешить использование в общей галерее"
            : "Удалить из общей галереи"}
        </Button>
      )}

      {/* Images Grid */}
      {images.length === 0 ? (
        <p>Картинки не найдены</p>
      ) : (
        <div className={styles.imageGrid}>
          {images.map((image) => (
            <div
              key={image._id}
              className={`${styles.imageCard} ${selectedImages.includes(image._id) ? styles.selected : ""}`}
              onClick={() => {
                if (isSelecting) {
                  handleImageSelect(image._id);
                } else {
                  if (activeTab === "inGallery") {
                      openModalWithImage(image);
                  }
                }
              }}
              style={{
                cursor: isSelecting ? "pointer" : "default",
                border: selectedImages.includes(image._id) ? "2px solid blue" : "none",
              }}
            >
              <img src={`${USER_IMAGES_URL}${image.res_image}`} alt={image.prompt} />
              <p>
                <strong>Prompt:</strong> {image.prompt}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <div className={styles.card}>
        <Select placeholder="Выбрать страницу" onChange={(e) => handlePageChange(Number(e.target.value))} value={currentPage.toString()}>
          {Array.from({ length: totalPages }).map((_, index) => (
            <SelectItem key={index + 1} value={(index + 1).toString()}>
              Страница {index + 1}
            </SelectItem>
          ))}
        </Select>
      </div>

      {selectedImage && (
        <div 
				className={`${styles['image__overlay']} ${!isImagetModalOpen ? 'hidden' : ''}`} 
			>
				<div className={styles['image__modal']}>
					<Modal 
						backdrop="blur" 
						isOpen={isImagetModalOpen} 
						onClose={closeImageModal} 
						size="sm"
						placement="center"
						className={styles['image_modal__inner']}
					>
						<ModalContent>
                <h2>Редактирование данных изображения</h2>

                <p>
                  <strong className={styles['image_modal_param_name']}>Количество лайков:</strong>{" "}
                  {isEditingLikes ? (
                    <Input value={likes?.toString()} onChange={handleLikesChange} />
                  ) : (
                    <span>{likes}</span>
                  )}
                </p>
                <Button onClick={toggleEditLikes}>
                  {isEditingLikes ? "Отменить редактирование" : "Изменить количество лайков"}
                </Button>

                <p>
                  <strong className={styles['image_modal_param_name']}>Категория изображения:</strong>
                  <Select
                    placeholder="Выберите категорию"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <SelectItem key="Photography" value="Photography">Photography</SelectItem>
                    <SelectItem key="Animals" value="Animals">Animals</SelectItem>
                    <SelectItem key="Anime" value="Anime">Anime</SelectItem>
                    <SelectItem key="Architecture" value="Architecture">Architecture</SelectItem>
                    <SelectItem key="Character" value="Character">Character</SelectItem>
                    <SelectItem key="Food" value="Food">Food</SelectItem>
                    <SelectItem key="Sci-Fi" value="Sci-Fi">Sci-Fi</SelectItem>
                  </Select>
                </p>

                <Button color='success' onClick={handleUpdateImage}>Обновить данные изображения</Button>
						</ModalContent>
					</Modal>
				</div>
			</div>
      ) }

    </div>
  );
};

export default ImageList;