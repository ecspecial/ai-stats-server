import React, { useState, useEffect } from 'react';
import styles from "@/styles/Stats.module.css";

const Pagination = ({ totalPages, currentPage, handlePageChange }: { totalPages: number, currentPage: number, handlePageChange: (page: number) => void }) => {
  const [pages, setPages] = useState<number[]>([]);

  useEffect(() => {
    const generatePages = () => {
      let pagesArray: number[] = [];
      
      // Always show the first page
      pagesArray.push(1);
      
      // Handle pages before and after the current page
      if (currentPage > 3) {
        pagesArray.push(currentPage - 2, currentPage - 1);
      } else if (currentPage > 1) {
        for (let i = 2; i < currentPage; i++) {
          pagesArray.push(i);
        }
      }

      // Add current page
      if (currentPage !== 1 && currentPage !== totalPages) {
        pagesArray.push(currentPage);
      }

      // Handle pages after the current page
      if (currentPage < totalPages - 2) {
        pagesArray.push(currentPage + 1, currentPage + 2);
      } else if (currentPage < totalPages) {
        for (let i = currentPage + 1; i < totalPages; i++) {
          pagesArray.push(i);
        }
      }

      // Show ellipsis and the last page if necessary
      if (currentPage < totalPages - 3) {
        pagesArray.push(-1); // Special case for '...'
      }

      if (totalPages > 1) {
        pagesArray.push(totalPages);
      }

      setPages(pagesArray);
    };

    generatePages();
  }, [currentPage, totalPages]);

  return (
    <div className={styles.pagination}>
      {/* Previous Button */}
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={styles.prevNextButton}
      >
        Назад
      </button>

      {/* Page numbers */}
      {pages.map((page, index) => {
        if (page === -1) {
          return (
            <span key={index} className={styles.ellipsis}>
              ...
            </span>
          );
        } else {
          return (
            <button
              key={index}
              onClick={() => handlePageChange(page)}
              className={`${styles.pageButton} ${page === currentPage ? styles.activePage : ''}`}
            >
              {page}
            </button>
          );
        }
      })}

      {/* Next Button */}
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={styles.prevNextButton}
      >
        Вперед
      </button>
    </div>
  );
};

export default Pagination;