import { useState } from 'react';
import * as XLSX from 'xlsx';
import './AddMembersFab.css';

export default function AddMembersFab({ onClose }) {
    // const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState('upload');
    const [members, setMembers] = useState([]);
    const [emailSubject, setEmailSubject] = useState('Welcome to Our Club!');
    const [emailContent, setEmailContent] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);

    const showToastNotification = (message, type = 'success') => {
        setToastMessage({ text: message, type });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const handleFileUpload = (file) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                const hasEmailColumn = jsonData.some((row) =>
                    'email' in row || 'Email' in row || 'EMAIL' in row
                );

                if (!hasEmailColumn) {
                    showToastNotification('Excel file must contain an "email" column', 'error');
                    return;
                }

                const normalizedMembers = jsonData.map((row) => ({
                    ...row,
                    email: row.email || row.Email || row.EMAIL,
                })).filter(member => member.email);

                setMembers(normalizedMembers);
                setStep('email');
                showToastNotification(`${normalizedMembers.length} members found`, 'success');
            } catch (error) {
                showToastNotification('Failed to parse Excel file', 'error');
            }
        };

        reader.readAsBinaryString(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
            handleFileUpload(file);
        } else {
            showToastNotification('Please upload an Excel file (.xlsx or .xls)', 'error');
        }
    };

    const handleFileInput = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const handleSubmit = async () => {
        if (!emailContent.trim()) {
            showToastNotification('Please enter email content', 'error');
            return;
        }

        setStep('processing');

        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('Adding members:', members);
        console.log('Email subject:', emailSubject);
        console.log('Email content:', emailContent);

        setStep('success');

        setTimeout(() => {
            onClose();
            showToastNotification(`Successfully added ${members.length} members and sent welcome emails!`, 'success');
            setTimeout(() => {
                setStep('upload');
                setMembers([]);
                setEmailContent('');
                setEmailSubject('Welcome to Our Club!');
            }, 300);
        }, 2000);
    };

    const resetDialog = () => {
        onClose();
        setTimeout(() => {
            setStep('upload');
            setMembers([]);
            setEmailContent('');
            setEmailSubject('Welcome to Our Club!');
        }, 300);
    };

    return (
        <div className="app-wrapper">


            {/* Floating Action Button */}
            {/* <button
                onClick={() => setIsOpen(true)}
                className="fab-button"
            >
                <svg className="fab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="fab-badge">
                    +
                </span>
            </button> */}

            {/* Dialog Modal */}
            
                <div className="modal-overlay" onClick={resetDialog}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={resetDialog}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        <div className="modal-header">
                            <h2 className="modal-title">
                                {step === 'upload' && (
                                    <>
                                        <svg className="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <line x1="16" y1="13" x2="8" y2="13" />
                                            <line x1="16" y1="17" x2="8" y2="17" />
                                            <polyline points="10 9 9 9 8 9" />
                                        </svg>
                                        Upload Member List
                                    </>
                                )}
                                {step === 'email' && (
                                    <>
                                        <svg className="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                        Compose Welcome Email
                                    </>
                                )}
                                {step === 'processing' && (
                                    <>
                                        <svg className="title-icon icon-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                        Processing...
                                    </>
                                )}
                                {step === 'success' && (
                                    <>
                                        <svg className="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Success!
                                    </>
                                )}
                            </h2>
                            <p className="modal-description">
                                {step === 'upload' && 'Upload an Excel file containing member emails to add them to your club'}
                                {step === 'email' && `Compose a welcome email for ${members.length} new members`}
                                {step === 'processing' && 'Adding members and sending emails...'}
                                {step === 'success' && 'Members have been added and emails sent successfully!'}
                            </p>
                        </div>

                        {/* Upload Step */}
                        {step === 'upload' && (
                            <div className="modal-body">
                                <div
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                                >
                                    <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                        <polyline points="10 9 9 9 8 9" />
                                    </svg>
                                    <p className="upload-main-text">
                                        Drop your Excel file here
                                    </p>
                                    <p className="upload-sub-text">
                                        or click to browse
                                    </p>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={handleFileInput}
                                        className="file-input-hidden"
                                        id="file-upload"
                                    />
                                    <label htmlFor="file-upload">
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('file-upload')?.click()}
                                            className="select-file-button"
                                        >
                                            Select File
                                        </button>
                                    </label>
                                </div>

                                <div className="info-box">
                                    <div className="info-bullet" />
                                    <div>
                                        <p className="info-title">
                                            Excel Requirements
                                        </p>
                                        <p className="info-text">
                                            Your Excel file must contain an <strong>email</strong> column.
                                            Additional columns like name, student ID, etc. are optional.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Email Composition Step */}
                        {step === 'email' && (
                            <div className="modal-body">
                                <div className="member-count-box">
                                    <p className="member-count-text">
                                        <strong>{members.length}</strong> members ready to be added
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="subject" className="form-label">
                                        Email Subject
                                    </label>
                                    <input
                                        id="subject"
                                        type="text"
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                        className="form-input"
                                        placeholder="Enter email subject"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="content" className="form-label">
                                        Email Content
                                    </label>
                                    <textarea
                                        id="content"
                                        value={emailContent}
                                        onChange={(e) => setEmailContent(e.target.value)}
                                        className="form-textarea"
                                        placeholder="Write your welcome message here..."
                                    />
                                    <p className="helper-text">
                                        This message will be sent to all {members.length} members
                                    </p>
                                </div>

                                <div className="button-group">
                                    <button
                                        onClick={() => setStep('upload')}
                                        className="button button-secondary"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        className="button button-primary"
                                    >
                                        Add Members & Send Emails
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Processing Step */}
                        {step === 'processing' && (
                            <div className="processing-container">
                                <div className="spinner" />
                                <p className="processing-text">
                                    Adding members and sending emails...
                                </p>
                            </div>
                        )}

                        {/* Success Step */}
                        {step === 'success' && (
                            <div className="success-container">
                                <div className="success-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <p className="success-title">
                                    All Done!
                                </p>
                                <p className="success-text">
                                    {members.length} members added successfully
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            

            {/* Toast Notification */}
            {showToast && (
                <div className={`toast ${toastMessage.type === 'error' ? 'toast-error' : 'toast-success'}`}>
                    {toastMessage.text}
                </div>
            )}
        </div>
    );
}
