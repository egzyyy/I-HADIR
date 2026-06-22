import { useState } from 'react';

export function usePagination<T>(data: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  
  // The actual sliced data for the current page
  const currentData = data.slice(startIndex, endIndex);

  // A safe setter that ensures we don't go out of bounds
  const goToPage = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  };

  return {
    currentPage,
    setCurrentPage: goToPage,
    totalPages,
    startIndex,
    endIndex,
    currentData,
    totalItems,
  };
}