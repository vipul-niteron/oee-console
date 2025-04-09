"use client";

import { useState, useEffect, useRef } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import Link from "next/link";
import styles from "./reports.module.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

// Interface for processed image data
interface ImageData {
  name: string;
  data: string;
  type: string;
  size: number;
}

export default function ReportsPage() {
  // State for PDI submission data
  const [submissions, setSubmissions] = useState<Array<Schema["PDISubmission"]["type"]>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("customerName");
  
  // State for date filtering
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Add ref for the table container
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  // Handle horizontal scrolling indicators
  const [showScrollLeft, setShowScrollLeft] = useState(false);
  const [showScrollRight, setShowScrollRight] = useState(false);
  
  // Image modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<ImageData[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Handle mobile viewport height issues
  useEffect(() => {
    // Force initial scroll to top
    window.scrollTo(0, 0);
    
    // Set actual viewport height for mobile browsers
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      
      // Fix for iOS Safari's variable viewport height
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    
    // Set safe area insets for notched phones
    const setSafeAreaInsets = () => {
      if (window.innerWidth <= 768) {
        // Force scroll to top after resize/orientation change
        window.scrollTo(0, 0);
      }
    };
    
    // Run both fixes initially
    setViewportHeight();
    setSafeAreaInsets();
    
    // Add event listeners for resize and orientation change
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', () => {
      setTimeout(setViewportHeight, 100);
      setTimeout(setSafeAreaInsets, 100);
    });
    
    // Ensure iOS keyboard doesn't cause layout issues
    window.addEventListener('focusin', (e) => {
      if (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) && 
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)
      ) {
        document.body.classList.add('keyboard-open');
      }
    });
    
    window.addEventListener('focusout', () => {
      document.body.classList.remove('keyboard-open');
      window.scrollTo(0, 0);
    });
    
    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', () => {
        setTimeout(setViewportHeight, 100);
        setTimeout(setSafeAreaInsets, 100);
      });
      window.removeEventListener('focusin', () => {});
      window.removeEventListener('focusout', () => {});
    };
  }, []);
  
  // Fetch submissions on component mount
  useEffect(() => {
    async function fetchSubmissions() {
      try {
        setIsLoading(true);
        const response = await client.models.PDISubmission.list();
        setSubmissions(response.data);
      } catch (err) {
        console.error("Error fetching submissions:", err);
        setError("Failed to load submissions. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSubmissions();
  }, []);
  
  // Handle search term change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle search field change
  const handleSearchFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchField(e.target.value);
  };
  
  // Filter and sort submissions
  const filteredSubmissions = submissions
    .filter(submission => {
      if (!searchTerm) return true;
      const value = submission[searchField as keyof typeof submission];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    })
    .filter(submission => {
      if (!startDate && !endDate) return true;
      const submissionDate = new Date(submission.createdAt || "");
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if (start && end) {
        return submissionDate >= start && submissionDate <= end;
      } else if (start) {
        return submissionDate >= start;
      } else if (end) {
        return submissionDate <= end;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || "");
      const dateB = new Date(b.createdAt || "");
      return sortOrder === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    });
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    
    const date = new Date(dateString);
    // Format: MM/DD/YYYY, HH:MM:SS PM/AM
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  // Check if scroll indicators should be shown
  const checkScrollIndicators = () => {
    if (!tableContainerRef.current) return;
    
    const container = tableContainerRef.current;
    setShowScrollLeft(container.scrollLeft > 0);
    setShowScrollRight(container.scrollLeft < (container.scrollWidth - container.clientWidth - 5));
  };
  
  // On window resize, check scroll indicators
  useEffect(() => {
    const handleResize = () => {
      checkScrollIndicators();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // When table container is scrolled, update scroll indicators
  const handleTableScroll = () => {
    checkScrollIndicators();
  };
  
  // After the component mounts and submissions are loaded, check scroll indicators
  useEffect(() => {
    if (!isLoading) {
      setTimeout(checkScrollIndicators, 100);
    }
  }, [isLoading, filteredSubmissions]);
  
  // Function to parse images from JSON string
  const parseImages = (imagesString: string | null | undefined): ImageData[] => {
    if (!imagesString) return [];
    try {
      return JSON.parse(imagesString);
    } catch (error) {
      console.error('Error parsing images:', error);
      return [];
    }
  };

  // Function to handle image view
  const handleViewImages = (imagesString: string | null | undefined) => {
    if (!imagesString) return;
    const parsedImages = parseImages(imagesString);
    if (parsedImages.length > 0) {
      setModalImages(parsedImages);
      setCurrentImageIndex(0);
      setModalOpen(true);
    }
  };

  // Function to handle modal navigation
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % modalImages.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + modalImages.length) % modalImages.length);
  };
  
  // Get display columns based on screen size
  const getDisplayColumns = () => {
    // Check if we're on client-side
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth <= 768;
      
      if (isMobile) {
        return ['customerName', 'state', 'model', 'tubSerialNumber', 'images', 'status', 'createdAt'];
      }
    }
    
    // Default for desktop
    return ['customerName', 'state', 'model', 'tubSerialNumber', 'customerEmail', 'customerPhone', 'images', 'status', 'createdAt'];
  };
  
  // Column labels for table header
  const columnLabels: Record<string, string> = {
    customerName: 'Customer Name',
    state: 'State',
    model: 'Model',
    tubSerialNumber: 'Tub S/N',
    customerEmail: 'Email',
    customerPhone: 'Phone',
    status: 'Status',
    createdAt: 'Submitted At',
    images: 'Images'
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSubmissions = filteredSubmissions.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of table
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.safeSpacer}></div>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.logoWrapper}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>W</span>
              <span className={styles.logoText}>WOVENGOLD</span>
            </div>
          </div>
          <h1 className={styles.mainTitle}>PDI Submission Reports</h1>
          <p className={styles.subtitle}>View and search all PDI submissions</p>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.reportsContainer}>
          <div className={styles.header}>
            <Link href="/" className={styles.backButton}>
              Back to Form
            </Link>
            <h2>PDI Submissions</h2>
          </div>
          
          {/* Date Filter and Sort Controls */}
          <div className={styles.dateControls}>
            <div className={styles.dateFilter}>
              <div className={styles.dateInputGroup}>
                <label htmlFor="startDate">From:</label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={styles.dateInput}
                />
              </div>
              <div className={styles.dateInputGroup}>
                <label htmlFor="endDate">To:</label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={styles.dateInput}
                />
              </div>
            </div>
            <div className={styles.sortControl}>
              <label htmlFor="sortOrder">Sort by Date:</label>
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                className={styles.sortSelect}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
          
          <div className={styles.searchContainer}>
            <div className={styles.searchField}>
              <label htmlFor="searchField">Search by:</label>
              <select 
                id="searchField"
                value={searchField}
                onChange={handleSearchFieldChange}
                className={styles.selectField}
              >
                <option value="customerName">Customer Name</option>
                <option value="state">State</option>
                <option value="model">Model</option>
                <option value="tubSerialNumber">Tub Serial Number</option>
                <option value="customerEmail">Email</option>
                <option value="customerPhone">Phone</option>
              </select>
            </div>
            
            <div className={styles.searchInput}>
              <input
                type="text"
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={handleSearchChange}
                className={styles.searchBox}
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loader}></div>
              <p>Loading submissions...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p className={styles.errorMessage}>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className={styles.retryButton}
              >
                Retry
              </button>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className={styles.emptyContainer}>
              <p>No PDI submissions found {searchTerm && "for your search criteria"}.</p>
            </div>
          ) : (
            <>
              <div className={styles.tableWrapper}>
                {showScrollLeft && <div className={styles.scrollIndicatorLeft}></div>}
                {showScrollRight && <div className={styles.scrollIndicatorRight}></div>}
                <div 
                  className={styles.tableContainer} 
                  ref={tableContainerRef}
                  onScroll={handleTableScroll}
                >
                  <table className={styles.submissionsTable}>
                    <thead>
                      <tr>
                        {getDisplayColumns().map(column => (
                          <th key={column}>{columnLabels[column]}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentSubmissions.map((submission) => (
                        <tr key={submission.id}>
                          {getDisplayColumns().map(column => {
                            if (column === 'status') {
                              return (
                                <td key={column}>
                                  <span className={
                                    submission.status === 'submitted' 
                                      ? styles.statusSubmitted 
                                      : styles.statusPending
                                  }>
                                    {submission.status || 'Pending'}
                                  </span>
                                </td>
                              );
                            } else if (column === 'createdAt') {
                              return <td key={column}>{formatDate(submission.createdAt)}</td>;
                            } else if (column === 'images') {
                              return (
                                <td className={styles.imageCell}>
                                  {submission.images && (
                                    <button 
                                      className={styles.viewImagesButton}
                                      onClick={() => handleViewImages(submission.images)}
                                    >
                                      View Images
                                    </button>
                                  )}
                                </td>
                              );
                            } else {
                              return <td key={column}>{submission[column as keyof typeof submission] as string}</td>;
                            }
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className={`${styles.pageButton} ${currentPage === 1 ? styles.disabled : ''}`}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  
                  <div className={styles.pageNumbers}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        className={`${styles.pageButton} ${currentPage === page ? styles.active : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    className={`${styles.pageButton} ${currentPage === totalPages ? styles.disabled : ''}`}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Page Info */}
              <div className={styles.pageInfo}>
                Showing {startIndex + 1} to {Math.min(endIndex, filteredSubmissions.length)} of {filteredSubmissions.length} submissions
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Image Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setModalOpen(false)}>
              ✕
            </button>
            <div className={styles.modalImageContainer}>
              <img 
                src={modalImages[currentImageIndex].data} 
                alt={`Image ${currentImageIndex + 1}`}
                className={styles.modalImage}
              />
            </div>
            {modalImages.length > 1 && (
              <div className={styles.modalNavigation}>
                <button onClick={handlePrevImage} className={styles.navButton}>
                  ←
                </button>
                <span className={styles.imageCounter}>
                  {currentImageIndex + 1} / {modalImages.length}
                </span>
                <button onClick={handleNextImage} className={styles.navButton}>
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 