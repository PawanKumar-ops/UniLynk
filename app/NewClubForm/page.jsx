"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BasicInfo from './club-onboarding/BasicInfo';
import ContactInfo from './club-onboarding/ContactInfo';
import WhatWeDo from './club-onboarding/WhatWeDo';
import LeadershipTeam from './club-onboarding/LeadershipTeam';
import PastActivities from './club-onboarding/PastActivities';
import './ClubOnboarding.css';

export default function ClubOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [submitError, setSubmitError] = useState('');

  const [clubData, setClubData] = useState({
    clubName: '',
    category: '',
    description: '',
    logo: '',
    banner: '',
    memberCount: 0,
    foundedDate: '',
    email: '',
    phone: '',
    website: '',
    instagram: '',
    twitter: '',
    linkedin: '',
    activities: [],
    leaders: [],
    pastEvents: [],
    upcomingEvents: [],
  });

  const updateClubData = (data) => {
    setClubData((currentData) => ({ ...currentData, ...data }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (submittedData = clubData) => {
    setSubmitError('');

    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submittedData),
      });

      if (!res.ok) {
        throw new Error('Failed to save club details. Please try again.');
      }

      router.push('/NewClubForm/success');
    } catch (error) {
      setSubmitError(error.message || 'Something went wrong while submitting the form.');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfo data={clubData} updateData={updateClubData} onNext={nextStep} />;
      case 2:
        return <ContactInfo data={clubData} updateData={updateClubData} onNext={nextStep} onBack={prevStep} />;
      case 3:
        return <WhatWeDo data={clubData} updateData={updateClubData} onNext={nextStep} onBack={prevStep} />;
      case 4:
        return <LeadershipTeam data={clubData} updateData={updateClubData} onNext={nextStep} onBack={prevStep} />;
      case 5:
        return <PastActivities data={clubData} updateData={updateClubData} onSubmit={handleSubmit} onBack={prevStep} />;
      default:
        return null;
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-header">
        <div className="onboarding-brand"><img src="ULynk.svg" alt="unilynk" />Unilynk</div>
        <p className="onboarding-subtitle">Club Registration</p>
      </div>

      <div className="onboarding-progress">
        <div className="progress-steps">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div
              key={step}
              className={`progress-step ${step <= currentStep ? 'active' : ''} ${step < currentStep ? 'completed' : ''}`}
            >
              <div className="step-number">{step}</div>
              <div className="step-label">
                {step === 1 && 'Basic Info'}
                {step === 2 && 'Contact'}
                {step === 3 && 'Activities'}
                {step === 4 && 'Team'}
                {step === 5 && 'Past Events'}
              </div>
            </div>
          ))}
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {submitError && (
        <p style={{ color: '#dc2626', textAlign: 'center', marginTop: '12px' }}>
          {submitError}
        </p>
      )}

      <div className="onboarding-content">
        {renderStep()}
      </div>
    </div>
  );
}
