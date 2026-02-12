import React, { memo } from "react";

const PaginationControls = ({ currentPage, totalPages, onPrevious, onNext, onPageSelect }) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination-controls">
      <button
        className="pagination-btn"
        disabled={currentPage === 1}
        onClick={onPrevious}
        type="button"
      >
        Previous
      </button>
      <span className="pagination-status">
        Page {currentPage} of {totalPages}
      </span>
      <div className="pagination-pages">
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
          <button
            key={pageNumber}
            className={`pagination-btn page-number ${currentPage === pageNumber ? "active" : ""}`}
            onClick={() => onPageSelect(pageNumber)}
            type="button"
          >
            {pageNumber}
          </button>
        ))}
      </div>
      <button
        className="pagination-btn"
        disabled={currentPage === totalPages}
        onClick={onNext}
        type="button"
      >
        Next
      </button>
    </div>
  );
};

export default memo(PaginationControls);