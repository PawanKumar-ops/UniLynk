"use client"

import { useRouter } from 'next/navigation';
import './success.css';

export default function Success() {
  const router = useRouter();

  return (
    <div className="success-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo" onClick={() => router.push('/')}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <span className="logo-text">Unilynk</span>
          </div>
        </div>
      </header>

      {/* Success Content */}
      <main className="success-content">
        <div className="success-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>

        <h1 className="success-title">Application Submitted!</h1>
        
        <p className="success-description">
          Thank you for registering your club with Unilynk. We've received your application 
          and our team will review it within 2-3 business days.
        </p>

        {/* What's Next Section */}
        <div className="next-steps">
          <h2 className="next-steps-title">What's Next?</h2>
          <div className="steps-list">
            <div className="step-item">
              <div className="step-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div className="step-content">
                <h3 className="step-title">Check Your Email</h3>
                <p className="step-description">
                  We've sent a confirmation email to your leadership team members. 
                  Please verify your email addresses.
                </p>
              </div>
            </div>

            <div className="step-item">
              <div className="step-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div className="step-content">
                <h3 className="step-title">Review Process</h3>
                <p className="step-description">
                  Our team will review your club information and activities. 
                  This typically takes 2-3 business days.
                </p>
              </div>
            </div>

            <div className="step-item">
              <div className="step-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div className="step-content">
                <h3 className="step-title">Get Started</h3>
                <p className="step-description">
                  Once approved, you'll receive access to your club dashboard where you can 
                  manage members, post updates, and connect with students.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="contact-box">
          <p className="contact-text">
            Have questions? Contact us at{' '}
            <a href="mailto:support@unilynk.com" className="contact-link">
              support@unilynk.com
            </a>
          </p>
        </div>

        {/* CTA */}
        <button onClick={() => router.push('/')} className="return-button">
          Return to Home
        </button>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p className="footer-text">© 2026 Unilynk. Connecting clubs, students, and companies.</p>
      </footer>
    </div>
  );
}
