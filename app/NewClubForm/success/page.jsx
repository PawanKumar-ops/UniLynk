"use client"

import { CheckCircle2, Mail, Users, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import './success.css';

export default function success() {
const router = useRouter();

  return (
    <div className="app-container">
      {/* Main Card */}
      <div className="main-card">
        {/* Header with Logo */}
        <div className="card-header">
          <h1 className="logo"><Image src="/ULynk.svg" alt='LOGO' width={80} height={30} />Unilynk</h1>
        </div>

        {/* Card Content */}
        <div className="card-content">
          {/* Success Icon and Message */}
          <div className="success-section">
            <div className="success-icon-wrapper">
              <CheckCircle2 className="success-icon" />
            </div>
            <h2 className="success-title">
              Registration Successful!
            </h2>
            <p className="success-subtitle">
              Your club has been registered with Unilynk
            </p>
          </div>

          {/* Next Steps */}
          <div className="next-steps-container">
            <h3 className="next-steps-title">What's Next?</h3>
            
            <div className="steps-list">
              <div className="step-item">
                <div className="step-number">
                  1
                </div>
                <div className="step-content">
                  <p className="step-text">
                    We'll review your registration within <strong>24-48 hours</strong>
                  </p>
                </div>
              </div>

              <div className="step-item">
                <div className="step-number">
                  2
                </div>
                <div className="step-content">
                  <p className="step-text">
                    You'll receive an <strong>email confirmation</strong> with dashboard access
                  </p>
                </div>
              </div>

              <div className="step-item">
                <div className="step-number">
                  3
                </div>
                <div className="step-content">
                  <p className="step-text">
                    Students can discover and <strong>connect with your club</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Row */}
          <div className="info-row">
            <div className="info-box">
              <Mail className="info-icon" />
              <p className="info-text">Check your email</p>
            </div>
            <div className="info-box">
              <Users className="info-icon" />
              <p className="info-text">Reach students</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="button-group">
            <button className="btn btn-primary" onClick={() => router.push('/')}>
              Return to Homepage
              <ArrowRight className="btn-icon" />
            </button>
            <button className="btn btn-secondary">
              Contact Support
            </button>
          </div>

          {/* Footer Note */}
          <div className="footer-note">
            <p>
              Questions? Email{' '}
              <a href="mailto:support@unilynk.com" className="footer-link">
                support@unilynk.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
