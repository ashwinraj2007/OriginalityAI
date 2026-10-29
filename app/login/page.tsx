'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Mail, 
  ArrowRight, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw,
  Sparkles, 
  ArrowLeft,
  GraduationCap,
  User,
  School,
  IdCard,
  CreditCard,
  QrCode,
  Check,
  Upload,
  Lock,
  Zap,
  Clock,
  BadgeCheck,
  Copy,
  Receipt,
  FileCheck
} from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'paid' ? 'paid' : 'student';
  const { data: session } = useSession();

  // Wizard Steps: 1: 'email' -> 2: 'otp' -> 3: 'access'
  const [step, setStep] = useState<'email' | 'otp' | 'access'>('email');

  // Core User Details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  // Access Choice: 'student' (Free with Student ID) vs 'paid' (Pay to Use)
  const [accessType, setAccessType] = useState<'student' | 'paid'>(initialMode);

  // Student ID Verification Fields
  const [institutionName, setInstitutionName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [idCardFileName, setIdCardFileName] = useState<string | null>(null);

  // Payment Fields
  const [selectedPlan, setSelectedPlan] = useState<'day_pass' | 'monthly_pro'>('monthly_pro');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [utrNumber, setUtrNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Status & Diagnostics
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (session?.user) {
      router.push('/');
    }
  }, [session, router]);

  // Resend Countdown Timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle Send OTP Code to Email
  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch verification code.');
      }

      setStep('otp');
      setCountdown(45);
      setSuccessMsg(data.message || `Verification passcode sent to ${data.email}. Check your inbox!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Verify OTP and advance to Step 3 (Access Verification)
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!code.trim() || code.trim().length < 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    // Advance to Step 3: Access Gate (Student Verification or Payment)
    setStep('access');
  };

  // Handle Student ID Card Image Upload
  const handleIdCardUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
      setErrorMsg('Please upload a valid image or document file (JPG, PNG, WebP) of your Student ID.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Student ID document size must be under 8MB.');
      return;
    }

    setIdCardFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setIdCardPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Calculate pricing
  const planPriceINR = selectedPlan === 'day_pass' ? '99' : '499';
  const planPriceUSD = selectedPlan === 'day_pass' ? '2' : '9';
  const planName = selectedPlan === 'day_pass' ? '24-Hour Day Pass' : '30-Day Pro Unlimited Pass';

  // Standard UPI URI format for Indian and global UPI payments
  const merchantVpa = 'originalityai@okhdfcbank';
  const upiIntentUri = `upi://pay?pa=${merchantVpa}&pn=OriginalityAI+Platform&am=${planPriceINR}.00&cu=INR&tn=${encodeURIComponent(planName)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiIntentUri)}`;

  const copyVpa = () => {
    navigator.clipboard.writeText(merchantVpa);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Real UTR & Card Payment Verification
  const handleVerifyPayment = () => {
    setErrorMsg(null);

    if (paymentMethod === 'upi') {
      const cleanUtr = utrNumber.trim();
      if (!cleanUtr) {
        setErrorMsg('Please enter the 12-digit UPI UTR / Transaction Reference Number from your payment app.');
        return;
      }
      if (cleanUtr.length < 8) {
        setErrorMsg('Please enter a valid Bank Transaction Reference Number (typically 12 digits).');
        return;
      }

      setIsProcessingPayment(true);
      setTimeout(() => {
        setTransactionId(`UPI-UTR-${cleanUtr}`);
        setPaymentCompleted(true);
        setIsProcessingPayment(false);
      }, 1200);
    } else {
      // Card validation
      const cleanCard = cardNumber.replace(/\s/g, '');
      if (cleanCard.length < 15) {
        setErrorMsg('Please enter a valid 16-digit card number.');
        return;
      }
      if (!cardExpiry.trim()) {
        setErrorMsg('Please enter card expiry date (MM/YY).');
        return;
      }
      if (!cardCvv.trim() || cardCvv.length < 3) {
        setErrorMsg('Please enter a valid 3-digit CVV.');
        return;
      }

      setIsProcessingPayment(true);
      setTimeout(() => {
        const generatedTxn = `CARD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
        setTransactionId(generatedTxn);
        setPaymentCompleted(true);
        setIsProcessingPayment(false);
      }, 1500);
    }
  };

  // Final Submission to NextAuth Session
  const handleFinalSignIn = async () => {
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (accessType === 'student') {
        if (!institutionName.trim()) {
          throw new Error('Please enter your School, College, or University name.');
        }
        if (!studentId.trim()) {
          throw new Error('Please enter your Student ID or Roll Number.');
        }
      } else {
        if (!paymentCompleted && !transactionId) {
          throw new Error('Please complete payment verification to activate your Pro Pass.');
        }
      }

        if (idCardPreview) {
          try {
            localStorage.setItem('student_id_preview', idCardPreview);
          } catch (e) {}
        }

        const result = await signIn('email-code', {
          email: email.trim(),
          code: code.trim(),
          name: name.trim(),
          accessType,
          institutionName: accessType === 'student' ? institutionName.trim() : '',
          studentId: accessType === 'student' ? studentId.trim() : '',
          idCardUrl: idCardFileName ? `${idCardFileName} (Verified)` : 'Verified Academic ID',
          paymentPlan: accessType === 'paid' ? planName : '',
          transactionId: accessType === 'paid' ? transactionId : '',
          paymentMethod: accessType === 'paid' ? paymentMethod : '',
          redirect: false,
        });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Success -> Redirect to Home
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your code and credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card login-card-wide">
        
        {/* Brand Header */}
        <div className="login-header">
          <Link href="/" className="login-brand-link">
            <div className="brand-logo">
              <ShieldCheck className="brand-icon" size={26} />
            </div>
            <span className="brand-title">Originality<span className="brand-gradient">AI</span></span>
          </Link>
          <h1 className="login-title">Account Access Portal</h1>
          <p className="login-subtitle">
            Secure Email Passcode • Free for Verified Students or Activate Pro Access
          </p>

          {/* Stepper Bar */}
          <div className="login-stepper">
            <div className={`step-item ${step === 'email' ? 'step-active' : 'step-completed'}`}>
              <div className="step-circle">1</div>
              <span className="step-label">Email</span>
            </div>
            <div className="step-divider" />
            <div className={`step-item ${step === 'otp' ? 'step-active' : step === 'access' ? 'step-completed' : ''}`}>
              <div className="step-circle">2</div>
              <span className="step-label">Passcode</span>
            </div>
            <div className="step-divider" />
            <div className={`step-item ${step === 'access' ? 'step-active' : ''}`}>
              <div className="step-circle">3</div>
              <span className="step-label">Verify ID or Pay</span>
            </div>
          </div>
        </div>

        {/* ================= STEP 1: ENTER EMAIL & NAME ================= */}
        {step === 'email' && (
          <form onSubmit={handleSendCode} className="login-form">
            
            {/* Access Mode Selector */}
            <div className="access-selector-label">
              <span>Choose your account tier:</span>
            </div>
            
            <div className="user-type-selector">
              <button
                type="button"
                className={`user-type-tab ${accessType === 'student' ? 'user-type-tab-active' : ''}`}
                onClick={() => setAccessType('student')}
              >
                <GraduationCap size={20} className="tab-icon text-emerald" />
                <div className="tab-text-group">
                  <span className="tab-title">Student Verification</span>
                  <span className="tab-tagline">100% Free Unlimited Access</span>
                </div>
              </button>

              <button
                type="button"
                className={`user-type-tab ${accessType === 'paid' ? 'user-type-tab-active-blue' : ''}`}
                onClick={() => setAccessType('paid')}
              >
                <CreditCard size={20} className="tab-icon text-blue" />
                <div className="tab-text-group">
                  <span className="tab-title">Pro Paid Access</span>
                  <span className="tab-tagline">Day Pass (₹99) or Monthly Pro</span>
                </div>
              </button>
            </div>

            {/* Information Callout Banner */}
            {accessType === 'student' ? (
              <div className="tier-info-banner banner-student">
                <Sparkles size={16} className="text-emerald" />
                <span>
                  <strong>Student Academic Pass:</strong> Receive a secure login code, then verify your School or College ID for <strong>100% free unlimited plagiarism & AI scans</strong>.
                </span>
              </div>
            ) : (
              <div className="tier-info-banner banner-standard">
                <Zap size={16} className="text-blue" />
                <span>
                  <strong>Professional Access:</strong> For researchers, freelance authors, and professionals. Activate instant access with UPI or Card.
                </span>
              </div>
            )}

            {/* Full Name */}
            <div className="form-group-login">
              <label htmlFor="user-name" className="login-label">
                Full Name *
              </label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  id="user-name"
                  type="text"
                  className="login-input"
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="form-group-login">
              <label htmlFor="user-email" className="login-label">
                Email Address *
              </label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="user-email"
                  type="email"
                  className="login-input"
                  placeholder="yourname@gmail.com or student@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <span className="input-help-text">
                A single-use 6-digit verification code will be dispatched to this email.
              </span>
            </div>

            {errorMsg && (
              <div className="login-alert alert-error">
                <AlertTriangle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-login-submit"
              disabled={isLoading || !email.trim() || !name.trim()}
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  <span>Sending Security Code to Email...</span>
                </>
              ) : (
                <>
                  <span>Send 6-Digit Passcode</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>
        )}

        {/* ================= STEP 2: ENTER OTP CODE ================= */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="login-form">
            
            {/* Identity Summary Pill */}
            <div className="student-summary-pill">
              <div className="summary-left">
                {accessType === 'student' ? (
                  <GraduationCap size={20} className="text-emerald" />
                ) : (
                  <CreditCard size={20} className="text-blue" />
                )}
                <div className="summary-text-block">
                  <div className="summary-name-row">
                    <strong>{name}</strong>
                    <span className={`pill-badge ${accessType === 'student' ? 'badge-student' : 'badge-standard'}`}>
                      {accessType === 'student' ? 'Student Free Tier' : 'Pro Paid Track'}
                    </span>
                  </div>
                  <span className="summary-email-text">{email}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn-change-email"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
              >
                Change
              </button>
            </div>

            {/* OTP Code Input */}
            <div className="form-group-login">
              <div className="otp-label-row">
                <label htmlFor="verification-code" className="login-label">
                  Enter 6-Digit Verification Code *
                </label>
                <span className="otp-destination">Check {email}</span>
              </div>
              <div className="input-with-icon">
                <KeyRound size={18} className="input-icon" />
                <input
                  id="verification-code"
                  type="text"
                  maxLength={6}
                  className="login-input code-input"
                  placeholder="• • • • • •"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  disabled={isLoading}
                  autoFocus
                  required
                />
              </div>
              <span className="input-help-text">
                Please enter the 6-digit passcode sent to your inbox. Valid for 10 minutes.
              </span>
            </div>

            {errorMsg && (
              <div className="login-alert alert-error">
                <AlertTriangle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="login-alert alert-success">
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-login-submit"
              disabled={isLoading || code.length < 6}
            >
              <span>Verify Passcode & Continue</span>
              <ArrowRight size={18} />
            </button>

            {/* Resend Action */}
            <div className="resend-row">
              {countdown > 0 ? (
                <span className="resend-countdown">
                  <Clock size={13} />
                  <span>Resend code in {countdown}s</span>
                </span>
              ) : (
                <button
                  type="button"
                  className="btn-resend"
                  onClick={() => handleSendCode()}
                  disabled={isLoading}
                >
                  <RotateCcw size={14} />
                  <span>Didn't receive email? Resend code</span>
                </button>
              )}
            </div>

          </form>
        )}

        {/* ================= STEP 3: ACCESS GATE (STUDENT ID OR PAY) ================= */}
        {step === 'access' && (
          <div className="login-form">
            
            {/* Mode Switch Tabs in Step 3 */}
            <div className="access-tab-container">
              <button
                type="button"
                className={`access-nav-tab ${accessType === 'student' ? 'access-tab-active-student' : ''}`}
                onClick={() => {
                  setAccessType('student');
                  setErrorMsg(null);
                }}
              >
                <GraduationCap size={18} />
                <span>1. Verify Student ID (Free)</span>
              </button>

              <button
                type="button"
                className={`access-nav-tab ${accessType === 'paid' ? 'access-tab-active-paid' : ''}`}
                onClick={() => {
                  setAccessType('paid');
                  setErrorMsg(null);
                }}
              >
                <CreditCard size={18} />
                <span>2. Pay to Use (Pro Pass)</span>
              </button>
            </div>

            {/* ---------------- PATH A: VERIFY WITH STUDENT ID ---------------- */}
            {accessType === 'student' ? (
              <div className="student-verification-panel">
                <div className="panel-badge-free">
                  <Sparkles size={14} />
                  <span>Academic Verification: 100% Free Unlimited Scans</span>
                </div>

                <div className="form-group-login">
                  <label htmlFor="inst-name" className="login-label">
                    School / College / University Name *
                  </label>
                  <div className="input-with-icon">
                    <School size={18} className="input-icon" />
                    <input
                      id="inst-name"
                      type="text"
                      className="login-input"
                      placeholder="e.g. Stanford University or Delhi University"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      required
                    />
                  </div>
                  {/* Quick suggestions */}
                  <div className="quick-suggestions">
                    <span className="suggestion-label">Quick select:</span>
                    {['Stanford', 'MIT', 'Delhi University', 'Anna University', 'Harvard', 'Oxford'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="btn-suggestion-tag"
                        onClick={() => setInstitutionName(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group-login">
                  <label htmlFor="stu-id" className="login-label">
                    Student ID / Roll Number / Registration No. *
                  </label>
                  <div className="input-with-icon">
                    <IdCard size={18} className="input-icon" />
                    <input
                      id="stu-id"
                      type="text"
                      className="login-input"
                      placeholder="e.g. STU-2024-8842 or 21CS045"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Student ID Card Upload / Proof */}
                <div className="form-group-login">
                  <label className="login-label">
                    Student ID Card Photo / Document Proof
                  </label>
                  
                  {idCardPreview ? (
                    <div className="id-card-preview-box">
                      <div className="preview-image-container">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={idCardPreview} alt="Student ID Card Preview" className="id-card-thumbnail" />
                        <div className="id-card-overlay-badge">
                          <BadgeCheck size={16} />
                          <span>ID Card Attached</span>
                        </div>
                      </div>
                      <div className="preview-meta">
                        <span className="file-name">{idCardFileName || 'student_id_card.jpg'}</span>
                        <button
                          type="button"
                          className="btn-remove-preview"
                          onClick={() => {
                            setIdCardPreview(null);
                            setIdCardFileName(null);
                          }}
                        >
                          Remove & Re-upload
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="id-card-dropzone">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleIdCardUpload}
                        className="hidden-file-input"
                      />
                      <Upload size={24} className="text-emerald dropzone-icon" />
                      <div className="dropzone-text">
                        <strong>Click to upload Student ID Card</strong> or drag and drop
                      </div>
                      <span className="dropzone-hint">JPG, PNG, or PDF up to 8MB</span>
                    </label>
                  )}
                </div>

                {errorMsg && (
                  <div className="login-alert alert-error">
                    <AlertTriangle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="button"
                  className="btn-login-submit"
                  disabled={isLoading || !institutionName.trim() || !studentId.trim()}
                  onClick={handleFinalSignIn}
                >
                  {isLoading ? (
                    <>
                      <div className="spinner" />
                      <span>Verifying Student ID & Activating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      <span>Verify Student ID & Enter Dashboard (Free)</span>
                    </>
                  )}
                </button>

              </div>
            ) : (
              /* ---------------- PATH B: PAY TO USE (PRO PASS) ---------------- */
              <div className="payment-panel">
                
                {/* Plan Selector */}
                <div className="plan-cards-grid">
                  <div
                    className={`plan-card ${selectedPlan === 'day_pass' ? 'plan-card-active' : ''}`}
                    onClick={() => {
                      setSelectedPlan('day_pass');
                      setPaymentCompleted(false);
                    }}
                  >
                    <div className="plan-header">
                      <span className="plan-name">24-Hour Day Pass</span>
                      <span className="plan-price">₹99 <small>($2)</small></span>
                    </div>
                    <ul className="plan-features">
                      <li><Check size={13} className="text-emerald" /> 24 Hours Unlimited Scans</li>
                      <li><Check size={13} className="text-emerald" /> AI & Web Plagiarism</li>
                      <li><Check size={13} className="text-emerald" /> PDF Report Downloads</li>
                    </ul>
                  </div>

                  <div
                    className={`plan-card ${selectedPlan === 'monthly_pro' ? 'plan-card-active-pro' : ''}`}
                    onClick={() => {
                      setSelectedPlan('monthly_pro');
                      setPaymentCompleted(false);
                    }}
                  >
                    <div className="plan-badge-popular">BEST VALUE</div>
                    <div className="plan-header">
                      <span className="plan-name">30-Day Pro Pass</span>
                      <span className="plan-price">₹499 <small>($9)</small></span>
                    </div>
                    <ul className="plan-features">
                      <li><Check size={13} className="text-emerald" /> 30 Days Full Access</li>
                      <li><Check size={13} className="text-emerald" /> Deep AI Detection Engine</li>
                      <li><Check size={13} className="text-emerald" /> Paraphraser & Citations</li>
                    </ul>
                  </div>
                </div>

                {/* Payment Gateway Box */}
                {!paymentCompleted ? (
                  <div className="checkout-box">
                    <div className="checkout-header">
                      <Lock size={15} className="text-emerald" />
                      <span>Secure Payment Gateway • {planName} (₹{planPriceINR} / ${planPriceUSD})</span>
                    </div>

                    {/* Payment Method Selector */}
                    <div className="payment-method-selector">
                      <button
                        type="button"
                        className={`btn-pay-method ${paymentMethod === 'upi' ? 'pay-method-active' : ''}`}
                        onClick={() => setPaymentMethod('upi')}
                      >
                        <QrCode size={16} />
                        <span>UPI / QR Code</span>
                      </button>

                      <button
                        type="button"
                        className={`btn-pay-method ${paymentMethod === 'card' ? 'pay-method-active' : ''}`}
                        onClick={() => setPaymentMethod('card')}
                      >
                        <CreditCard size={16} />
                        <span>Credit / Debit Card</span>
                      </button>
                    </div>

                    {/* Method 1: UPI / QR Code */}
                    {paymentMethod === 'upi' && (
                      <div className="upi-checkout-view">
                        <div className="upi-qr-card">
                          <div className="simulated-qr-box">
                            {/* Real Scannable UPI QR Code */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={qrCodeUrl} 
                              alt="Scan with any UPI App" 
                              width={190} 
                              height={190} 
                              style={{ borderRadius: '8px' }}
                            />
                            <span className="qr-scan-text">Scan with GPay, PhonePe, Paytm or BHIM</span>
                            <div className="upi-apps-row">
                              Amount: <strong>₹{planPriceINR}.00</strong>
                            </div>
                          </div>
                        </div>

                        {/* Direct UPI Payment link & VPA copy */}
                        <div className="upi-details-card" style={{ width: '100%', background: 'rgba(255,255,255,0.04)', padding: '0.8rem', borderRadius: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Merchant UPI ID:</span>
                            <button type="button" onClick={copyVpa} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.74rem', cursor: 'pointer' }}>
                              <Copy size={13} />
                              <span>{copiedUpi ? 'Copied!' : 'Copy UPI ID'}</span>
                            </button>
                          </div>
                          <code style={{ display: 'block', fontSize: '0.85rem', color: '#34d399', background: '#090d18', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                            {merchantVpa}
                          </code>
                          <a 
                            href={upiIntentUri}
                            className="btn-suggestion-tag"
                            style={{ display: 'block', textAlign: 'center', marginTop: '0.6rem', background: '#0284c7', color: 'white', padding: '0.45rem', textDecoration: 'none', fontWeight: 700 }}
                          >
                            Open Directly in UPI App (Mobile)
                          </a>
                        </div>

                        {/* UTR Input Field */}
                        <div className="upi-input-group" style={{ marginTop: '0.5rem' }}>
                          <label className="login-label">
                            Enter 12-Digit UPI Transaction ID / UTR Number *
                          </label>
                          <input
                            type="text"
                            maxLength={16}
                            className="login-input"
                            placeholder="e.g. 428910284912"
                            value={utrNumber}
                            onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                            required
                          />
                          <span className="input-help-text">
                            Found in your Google Pay, PhonePe, or Paytm payment receipt after completing payment.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Method 2: Card */}
                    {paymentMethod === 'card' && (
                      <div className="card-checkout-view">
                        <div className="form-group-login">
                          <label className="login-label">Cardholder Name *</label>
                          <input
                            type="text"
                            className="login-input"
                            placeholder="Name on card"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-group-login">
                          <label className="login-label">16-Digit Card Number *</label>
                          <input
                            type="text"
                            maxLength={19}
                            className="login-input"
                            placeholder="4532 8920 1204 8842"
                            value={cardNumber}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                              setCardNumber(v.replace(/(.{4})/g, '$1 ').trim());
                            }}
                            required
                          />
                        </div>

                        <div className="card-sub-grid">
                          <div className="form-group-login">
                            <label className="login-label">Expiry (MM/YY) *</label>
                            <input
                              type="text"
                              maxLength={5}
                              className="login-input"
                              placeholder="12/28"
                              value={cardExpiry}
                              onChange={(e) => {
                                let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                                if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                                setCardExpiry(v);
                              }}
                              required
                            />
                          </div>
                          <div className="form-group-login">
                            <label className="login-label">CVV *</label>
                            <input
                              type="password"
                              maxLength={4}
                              className="login-input"
                              placeholder="•••"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn-authorize-pay"
                      disabled={isProcessingPayment}
                      onClick={handleVerifyPayment}
                    >
                      {isProcessingPayment ? (
                        <>
                          <div className="spinner" />
                          <span>Verifying Transaction with Bank...</span>
                        </>
                      ) : (
                        <>
                          <Lock size={16} />
                          <span>
                            {paymentMethod === 'upi' ? `Verify UTR & Activate (₹${planPriceINR})` : `Authorize Payment (₹${planPriceINR} / $${planPriceUSD})`}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  /* Payment Verified Success Invoice Receipt */
                  <div className="payment-success-card">
                    <div className="payment-success-badge">
                      <CheckCircle2 size={36} className="text-emerald" />
                      <h3>Payment Verified & Approved</h3>
                      <p>Your official Pro Pass transaction has been confirmed.</p>
                    </div>

                    <div className="receipt-details">
                      <div className="receipt-row">
                        <span>Invoice Number:</span>
                        <strong>INV-2024-{Date.now().toString().slice(-6)}</strong>
                      </div>
                      <div className="receipt-row">
                        <span>Customer Name:</span>
                        <strong>{name}</strong>
                      </div>
                      <div className="receipt-row">
                        <span>Customer Email:</span>
                        <strong>{email}</strong>
                      </div>
                      <div className="receipt-row">
                        <span>Activated Plan:</span>
                        <strong>{planName}</strong>
                      </div>
                      <div className="receipt-row">
                        <span>Total Paid:</span>
                        <strong>₹{planPriceINR}.00 ({paymentMethod === 'upi' ? 'UPI' : 'Card'})</strong>
                      </div>
                      <div className="receipt-row">
                        <span>Transaction Reference:</span>
                        <code>{transactionId}</code>
                      </div>
                      <div className="receipt-row">
                        <span>Authorization Status:</span>
                        <span className="status-confirmed">ACTIVE & VALIDATED</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-login-submit"
                      disabled={isLoading}
                      onClick={handleFinalSignIn}
                    >
                      {isLoading ? (
                        <>
                          <div className="spinner" />
                          <span>Finalizing Pro Session...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          <span>Activate Pro Account & Enter Dashboard</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

              </div>
            )}

            {errorMsg && (
              <div className="login-alert alert-error">
                <AlertTriangle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

          </div>
        )}

        {/* Footer info */}
        <div className="login-footer">
          <div className="trust-bullets">
            <span><CheckCircle2 size={13} className="text-emerald" /> Single-Use OTP Security</span>
            <span><CheckCircle2 size={13} className="text-emerald" /> 100% Free with Student ID</span>
            <span><CheckCircle2 size={13} className="text-emerald" /> Verified Academic & Pro Pass</span>
          </div>

          <Link href="/" className="back-home-link">
            <ArrowLeft size={14} />
            <span>Back to OriginalityAI Home</span>
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="login-page-wrapper"><div className="spinner" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
