"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const getVisiblePages = () => {
    const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
    return pages.slice(
      Math.max(0, currentPage - 3),
      Math.min(totalPages, currentPage + 2)
    );
  };

  return (
    <div className="flex justify-center items-center mt-6 space-x-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-2 rounded-full ${
          currentPage === 1
            ? "text-gray-400 cursor-not-allowed"
            : "text-blue-600 hover:bg-blue-100"
        }`}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="w-6 h-6 sm:w-5 sm:h-5" />
      </button>
      {getVisiblePages().map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            currentPage === page
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-blue-100"
          }`}
          aria-label={`${page} 페이지로 이동`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`p-2 rounded-full ${
          currentPage === totalPages
            ? "text-gray-400 cursor-not-allowed"
            : "text-blue-600 hover:bg-blue-100"
        }`}
        aria-label="다음 페이지"
      >
        <ChevronRight className="w-6 h-6 sm:w-5 sm:h-5" />
      </button>
    </div>
  );
}
