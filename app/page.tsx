"use client";

import { useState, useEffect, useRef } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import styles from "./page.module.css";
import Link from "next/link";
import { sendSMS, createNotificationMessage } from './utils/twilio';

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  // Form state
  const [formData, setFormData] = useState({
    customerName: "",
    state: "",
    model: "",
    tubSerialNumber: "",
    customerEmail: "",
    customerPhone: "",
  });
  
  // Customer name suggestions based on state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState<string[]>([]);
  
  // State to customer mapping
  const stateCustomerMap: Record<string, string[]> = {
    "DELHI": ["VINAY SINGH", "RAJEEV SIR", "VIJAY", "MUKENDRA"],
    "PUNJAB": ["UMAR", "MANMEET"],
    "HARYANA": ["SIDDHARTHA"],
    "UTTRAKHAND": ["YOGAMBER"],
    "AGRA": ["AVHDESH KUMAR"],
    "CHANDIGARH": ["VIJAY THAKUR"],
    "ODISHA": ["NARAYAN MOHARANA"],
    "KOLKATA": ["ATANU CHATTERJEE"],
    "JHARKHAND": ["PANKAJ"],
    "ASSAM / ARUNACHAL": ["MANOJ MANDAL"],
    "LUCKNOW": ["ASHISH KUMAR"],
    "UTTAR PRADESH": ["PRADEEP"],
    "VARANASI": ["BABLU PATHAK"],
    "PATNA BIHAR": ["AMIT"],
    "VIJAYAWADA": ["NAGAARJUNA"],
    "ANDHRA PRADESH": ["SAI KUMAR"],
    "TAMIL NADU": ["JAY KUMAR"],
    "KARNATAKA BANGLORE": ["CHANDRAKANT"],
    "TELANGANA": ["RAJENDRA"],
    "RAJASTHAN": ["SANDEEP SINGHANIA"],
    "GUJARAT": ["MUKUND RAJVANSHI"],
    "SURAT": ["AJEET JHA", "PINKESH"],
    "INDORE": ["KUNAL PRABHAKAR"],
    "BHOPAL": ["PRABHAT"],
    "CHHATTISGARH & RAIPUR": ["SEKHAR"],
    "MAHARASHTRA MUMBAI": ["DEEPAK KUMAR SINGH"],
    "PUNE": ["PRADIPTA NAYAK"]
  };
  
  // Images state
  interface ImageState {
    name: string;
    file: File | null;
    preview: string;
  }

  const [images, setImages] = useState<ImageState[]>([
    { name: "", file: null, preview: "" },
    { name: "", file: null, preview: "" },
    { name: "", file: null, preview: "" },
    { name: "", file: null, preview: "" },
  ]);
  
  // Status state (success, error, or null)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({
    type: null,
    message: ""
  });
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Refs for file inputs
  const fileInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Handle viewport sizing and mobile issues
  useEffect(() => {
    // Initial scroll reset
    window.scrollTo(0, 0);
    
    // Fix viewport sizing for both mobile and desktop
    const handleResize = () => {
      // Mobile-specific adjustments
      if (window.innerWidth <= 768) {
        // Set viewport height variables for mobile browsers
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
      } else {
        // Desktop-specific adjustments - use standard viewport units
        document.documentElement.style.removeProperty('--vh');
        document.documentElement.style.removeProperty('--app-height');
      }
      
      // Handle safe area insets for all devices
      if (CSS.supports('padding: env(safe-area-inset-top)')) {
        document.documentElement.style.setProperty(
          '--safe-area-inset-top',
          'env(safe-area-inset-top)'
        );
        document.documentElement.style.setProperty(
          '--safe-area-inset-bottom',
          'env(safe-area-inset-bottom)'
        );
      }
    };
    
    // Initial call
    handleResize();
    
    // Reset viewport on orientation change
    const handleOrientationChange = () => {
      // Add a small delay to let the browser finish orientation change
      setTimeout(() => {
        handleResize();
        window.scrollTo(0, 0);
        
        // Fix for iOS keyboard hiding inputs
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName)) {
          activeElement.scrollIntoView({ block: 'center' });
        }
      }, 100);
    };
    
    // Handle keyboard showing on mobile
    const handleFocusIn = (e: FocusEvent) => {
      if (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) && 
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)
      ) {
        document.body.classList.add('keyboard-open');
        
        // Give iOS time to adjust, then scroll to the input
        setTimeout(() => {
          (e.target as HTMLElement).scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 300);
      }
    };
    
    // Handle keyboard hiding on mobile
    const handleFocusOut = () => {
      document.body.classList.remove('keyboard-open');
      
      // Only scroll to top if we're not focusing another input and we're on mobile
      if (
        window.innerWidth <= 768 &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement as HTMLElement)?.tagName || '')
      ) {
        setTimeout(() => window.scrollTo(0, 0), 100);
      }
    };
    
    // Add optimized event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      
      // Clean up image previews
      images.forEach(image => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [images]);

  // List of Indian states for dropdown
  const states = Object.keys(stateCustomerMap).sort();

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // If state changed, show customer suggestions
    if (name === "state" && value) {
      setCustomerSuggestions(stateCustomerMap[value] || []);
      if (stateCustomerMap[value]?.length > 0) {
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }
  };
  
  // Handle customer name suggestion selection
  const handleSelectCustomer = (customerName: string) => {
    setFormData({
      ...formData,
      customerName
    });
    setShowSuggestions(false);
  };
  
  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Create a copy of images array
      const newImages = [...images];
      
      // Clean up previous preview if it exists
      if (newImages[index].preview) {
        URL.revokeObjectURL(newImages[index].preview);
      }
      
      // Update the image at the specific index
      newImages[index] = {
        name: file.name,
        file,
        preview: URL.createObjectURL(file)
      };
      
      setImages(newImages);
    }
  };
  
  // Trigger file input click
  const handleUploadClick = (index: number) => {
    if (fileInputRefs[index].current) {
      fileInputRefs[index].current?.click();
    }
  };
  
  // Remove an image
  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    
    // Clean up preview URL
    if (newImages[index].preview) {
      URL.revokeObjectURL(newImages[index].preview);
    }
    
    // Reset the image at the specific index
    newImages[index] = { name: "", file: null, preview: "" };
    
    setImages(newImages);
    
    // Reset the file input
    if (fileInputRefs[index].current) {
      fileInputRefs[index].current!.value = "";
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({
      type: null,
      message: ""
    });

    try {
      // Process images first
      const processedImages = await Promise.all(
        images.map(async (image) => {
          try {
            if (!image.file) {
              return null;
            }
            const base64 = await convertToBase64(image.file);
            return {
              name: image.name,
              data: base64,
              type: image.file.type,
              size: image.file.size,
            };
          } catch (error) {
            console.error('Error processing image:', error);
            return null;
          }
        })
      );

      // Filter out any failed image conversions
      const validImages = processedImages.filter((img): img is NonNullable<typeof img> => img !== null);

      // Create submission data
      const submissionData = {
        customerName: formData.customerName,
        state: formData.state,
        model: formData.model,
        tubSerialNumber: formData.tubSerialNumber,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        images: JSON.stringify(validImages),
        status: 'submitted',
      };

      // Submit to database
      const response = await client.models.PDISubmission.create(submissionData);

      // Send confirmation email
      try {
        const emailResponse = await fetch('/api/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            toEmail: formData.customerEmail,
            customerName: formData.customerName,
            state: formData.state,
            model: formData.model,
            tubSerialNumber: formData.tubSerialNumber,
            images: JSON.stringify(validImages)
          }),
        });

        if (!emailResponse.ok) {
          console.error('Failed to send email:', await emailResponse.json());
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the submission if email fails
      }

      // Send SMS notification to customer
      if (formData.customerPhone && formData.customerName && formData.state && formData.model) {
        const message = createNotificationMessage(
          formData.customerName,
          formData.state,
          formData.model
        );
        
        const smsResult = await sendSMS(formData.customerPhone, message);
        
        if (smsResult.success) {
          console.log('SMS notification sent successfully');
        } else {
          console.error('Failed to send SMS notification:', smsResult.error);
        }
      }

      // Reset form after successful submission
      setFormData({
        customerName: "",
        state: "",
        model: "",
        tubSerialNumber: "",
        customerEmail: "",
        customerPhone: "",
      });
      
      // Clear images with proper type
      setImages([
        { name: "", file: null, preview: "" },
        { name: "", file: null, preview: "" },
        { name: "", file: null, preview: "" },
        { name: "", file: null, preview: "" },
      ]);
      
      // Reset file inputs
      fileInputRefs.forEach(ref => {
        if (ref.current) ref.current.value = "";
      });
      
      // Show success message
      setStatus({
        type: 'success',
        message: 'PDI submission successful!'
      });
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setStatus({
          type: null,
          message: ""
        });
      }, 5000);
    } catch (err) {
      console.error('Error submitting form:', err);
      setStatus({
        type: 'error',
        message: 'Failed to submit form. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper function to convert File to base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
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
          <h1 className={styles.mainTitle}>Welcome to Wovengold PDI</h1>
          <p className={styles.subtitle}>Please complete the PDI submission form below</p>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.formContainer}>
          <div className={styles.header}>
            <h2>PDI Submission</h2>
            <Link href="/reports" className={styles.reportsButton}>Reports</Link>
          </div>

          {/* Status Messages */}
          {status.type === 'success' && (
            <div className={styles.successMessage}>
              <span className={styles.statusIcon}>✓</span> {status.message}
            </div>
          )}
          {status.type === 'error' && (
            <div className={styles.errorMessage}>
              <span className={styles.statusIcon}>✕</span> {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.responsiveForm}>
            <div className={styles.formGroup}>
              <label htmlFor="state">Select State *</label>
              <select 
                id="state" 
                name="state" 
                value={formData.state} 
                onChange={handleChange}
                required
              >
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="customerName">Customer Name *</label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="Enter customer's full name"
                required
              />
              {showSuggestions && customerSuggestions.length > 0 && (
                <div className={styles.suggestionsList}>
                  <p className={styles.suggestionsLabel}>Customer suggestions for {formData.state}:</p>
                  {customerSuggestions.map((customer, index) => (
                    <div 
                      key={index} 
                      className={styles.suggestionItem}
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      {customer}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="model">Model *</label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="Enter tub model"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="tubSerialNumber">Tub Serial Number *</label>
                <input
                  type="text"
                  id="tubSerialNumber"
                  name="tubSerialNumber"
                  value={formData.tubSerialNumber}
                  onChange={handleChange}
                  placeholder="Enter tub serial number"
                  required
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="customerEmail">Customer Email *</label>
                <input
                  type="email"
                  id="customerEmail"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  placeholder="Enter customer's email address"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="customerPhone">Customer Phone *</label>
                <input
                  type="tel"
                  id="customerPhone"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number (e.g. 9521752392)"
                  required
                />
                <small className={styles.fieldNote}>Enter 10 digit mobile number without country code, SMS will be sent to this number using +91 (India) country code.</small>
              </div>
            </div>
            
            {/* Image Upload */}
            <div className={styles.formGroup}>
              <label>Upload Images (completely optional)</label>
              <div className={styles.imageUploadContainer}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <div 
                    key={index} 
                    className={`${styles.imageUpload} ${images[index].preview ? styles.hasImage : ''}`}
                    onClick={() => !images[index].preview && handleUploadClick(index)}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRefs[index]}
                      onChange={(e) => handleImageChange(e, index)}
                      style={{ display: 'none' }}
                    />
                    
                    {images[index].preview ? (
                      <div className={styles.previewContainer}>
                        <img 
                          src={images[index].preview} 
                          alt={`Preview ${index + 1}`}
                          className={styles.imagePreview} 
                        />
                        <button 
                          type="button"
                          className={styles.removeImageButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(index);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className={styles.uploadPlaceholder}>
                        <span className={styles.uploadIcon}>+</span>
                        <span className={styles.uploadText}>Image {index + 1}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <small className={styles.fieldNote}>
                Optional: Add up to 4 photos if desired. Supported formats: JPG, PNG. Max size: 5MB per image.
              </small>
            </div>

            <button 
              type="submit" 
              className={styles.submitButton} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit PDI'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
