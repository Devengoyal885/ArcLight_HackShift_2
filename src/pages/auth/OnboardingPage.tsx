import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Camera, ArrowRight, ArrowLeft, User as UserIcon, Briefcase, CheckCircle } from 'lucide-react';
import logo from '../../assets/sihlogo.png';
import './OnboardingPage.css';

type Role = 'candidate' | 'employer';

interface CandidateData {
    name: string;
    employmentStatus: string;
    age: string;
    gender: string;
    hearAboutUs: string;
}

interface CompanyData {
    companyName: string;
    industry: string;
    companySize: string;
    location: string;
    hearAboutUs: string;
}

export default function OnboardingPage() {
    const role = (localStorage.getItem('userRole') || 'candidate') as Role;
    const user = auth.currentUser;
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Candidate fields - pre-populate name from Firebase auth (Google)
    const [candidateData, setCandidateData] = useState<CandidateData>({
        name: user?.displayName || '',
        employmentStatus: '',
        age: '',
        gender: '',
        hearAboutUs: '',
    });

    // Company fields - pre-populate company name from Firebase auth
    const [companyData, setCompanyData] = useState<CompanyData>({
        companyName: user?.displayName || '',
        industry: '',
        companySize: '',
        location: '',
        hearAboutUs: '',
    });

    const handlePhotoClick = () => fileInputRef.current?.click();

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onload = () => setPhotoPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleCandidateChange = (field: keyof CandidateData, value: string) => {
        setCandidateData(prev => ({ ...prev, [field]: value }));
    };

    const handleCompanyChange = (field: keyof CompanyData, value: string) => {
        setCompanyData(prev => ({ ...prev, [field]: value }));
    };

    const handleFinish = async () => {
        setLoading(true);
        setError('');
        try {
            if (user) {
                const displayName = role === 'candidate' ? candidateData.name : companyData.companyName;
                let photoURL = user.photoURL || '';

                // If user uploaded a photo, convert to data URL for profile
                if (photoPreview) {
                    photoURL = photoPreview;
                }

                await updateProfile(user, { displayName, photoURL });

                // Store extended profile data in localStorage
                const profileKey = role === 'candidate' ? 'candidateProfile' : 'employerProfile';
                const profileData = role === 'candidate' ? candidateData : companyData;
                localStorage.setItem(profileKey, JSON.stringify({ ...profileData, photoURL }));
            }
            navigate(`/${role}`);
        } catch (err: any) {
            setError(err.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const totalSteps = 2;

    // ─── Step 1: Photo + Name ─────────────────────────────────────────────────
    const renderStep1 = () => (
        <div className="ob-step">
            <div className="ob-step-header">
                <h2>
                    {role === 'candidate' ? (
                        <><UserIcon size={22} className="ob-step-icon ob-step-icon--blue" /> Your Profile</>
                    ) : (
                        <><Briefcase size={22} className="ob-step-icon ob-step-icon--purple" /> Company Profile</>
                    )}
                </h2>
                <p>{role === 'candidate' ? "Let's set up your professional identity." : 'Tell us about your organisation.'}</p>
            </div>

            {/* Avatar Upload */}
            <div className="ob-avatar-section">
                <div className="ob-avatar-circle" onClick={handlePhotoClick} title="Click to upload photo">
                    {photoPreview ? (
                        <img src={photoPreview} alt="Profile Preview" />
                    ) : (
                        <div className="ob-avatar-placeholder">
                            <Camera size={28} />
                            <span>Upload Photo</span>
                        </div>
                    )}
                    <div className="ob-avatar-overlay"><Camera size={16} /></div>
                </div>
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handlePhotoChange}
                />
                <p className="ob-avatar-hint">
                    {photoFile ? photoFile.name : 'Click the circle to upload from device'}
                </p>
            </div>

            {/* Name Field */}
            {role === 'candidate' ? (
                <div className="ob-field">
                    <label htmlFor="ob-name">Full Name</label>
                    <div className="ob-input-wrap">
                        <UserIcon size={15} />
                        <input
                            id="ob-name"
                            type="text"
                            required
                            placeholder="e.g. Priya Sharma"
                            value={candidateData.name}
                            onChange={(e) => handleCandidateChange('name', e.target.value)}
                        />
                    </div>
                </div>
            ) : (
                <div className="ob-field">
                    <label htmlFor="ob-company">Company Name</label>
                    <div className="ob-input-wrap">
                        <Briefcase size={15} />
                        <input
                            id="ob-company"
                            type="text"
                            required
                            placeholder="e.g. Acme Technologies"
                            value={companyData.companyName}
                            onChange={(e) => handleCompanyChange('companyName', e.target.value)}
                        />
                    </div>
                </div>
            )}

            <button
                className="ob-btn ob-btn--primary"
                onClick={() => {
                    const nameVal = role === 'candidate' ? candidateData.name : companyData.companyName;
                    if (!nameVal.trim()) { setError('Please enter your name.'); return; }
                    setError('');
                    setStep(2);
                }}
            >
                Next <ArrowRight size={15} />
            </button>
        </div>
    );

    // ─── Step 2: Profile Details ──────────────────────────────────────────────
    const renderStep2 = () => (
        <div className="ob-step">
            <div className="ob-step-header">
                <h2>A little more about you</h2>
                <p>Help us personalise your experience.</p>
            </div>

            {role === 'candidate' ? (
                <div className="ob-fields">
                    {/* Employment Status */}
                    <div className="ob-field">
                        <label>I am currently a...</label>
                        <div className="ob-chip-group">
                            {['Student', 'Fresher', 'Working Professional', 'Self-Employed', 'Freelancer', 'Other'].map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    className={`ob-chip ${candidateData.employmentStatus === s ? 'ob-chip--active' : ''}`}
                                    onClick={() => handleCandidateChange('employmentStatus', s)}
                                >{s}</button>
                            ))}
                        </div>
                    </div>

                    {/* Age */}
                    <div className="ob-field">
                        <label htmlFor="ob-age">Age</label>
                        <div className="ob-input-wrap">
                            <input
                                id="ob-age"
                                type="number"
                                min="16"
                                max="80"
                                placeholder="e.g. 22"
                                value={candidateData.age}
                                onChange={(e) => handleCandidateChange('age', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Gender */}
                    <div className="ob-field">
                        <label>Gender</label>
                        <div className="ob-chip-group">
                            {['Male', 'Female', 'Non-Binary', 'Prefer not to say'].map(g => (
                                <button
                                    key={g}
                                    type="button"
                                    className={`ob-chip ${candidateData.gender === g ? 'ob-chip--active' : ''}`}
                                    onClick={() => handleCandidateChange('gender', g)}
                                >{g}</button>
                            ))}
                        </div>
                    </div>

                    {/* How did they hear */}
                    <div className="ob-field">
                        <label>How did you hear about CapAble?</label>
                        <div className="ob-chip-group">
                            {['Social Media', 'College / University', 'Friend / Referral', 'LinkedIn', 'Google Search', 'News / Blog', 'Other'].map(h => (
                                <button
                                    key={h}
                                    type="button"
                                    className={`ob-chip ${candidateData.hearAboutUs === h ? 'ob-chip--active' : ''}`}
                                    onClick={() => handleCandidateChange('hearAboutUs', h)}
                                >{h}</button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="ob-fields">
                    {/* Industry */}
                    <div className="ob-field">
                        <label>Industry</label>
                        <div className="ob-chip-group">
                            {['Technology', 'Finance & Banking', 'Healthcare', 'E-Commerce', 'Education', 'Manufacturing', 'Consulting', 'Other'].map(i => (
                                <button
                                    key={i}
                                    type="button"
                                    className={`ob-chip ${companyData.industry === i ? 'ob-chip--active' : ''}`}
                                    onClick={() => handleCompanyChange('industry', i)}
                                >{i}</button>
                            ))}
                        </div>
                    </div>

                    {/* Company Size */}
                    <div className="ob-field">
                        <label>Company Size</label>
                        <div className="ob-chip-group">
                            {['1–10', '11–50', '51–200', '201–500', '501–1000', '1000+'].map(sz => (
                                <button
                                    key={sz}
                                    type="button"
                                    className={`ob-chip ${companyData.companySize === sz ? 'ob-chip--active' : ''}`}
                                    onClick={() => handleCompanyChange('companySize', sz)}
                                >{sz} employees</button>
                            ))}
                        </div>
                    </div>

                    {/* Location */}
                    <div className="ob-field">
                        <label htmlFor="ob-location">Headquarters Location</label>
                        <div className="ob-input-wrap">
                            <input
                                id="ob-location"
                                type="text"
                                placeholder="e.g. Bengaluru, India"
                                value={companyData.location}
                                onChange={(e) => handleCompanyChange('location', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* How did they hear */}
                    <div className="ob-field">
                        <label>How did you hear about CapAble?</label>
                        <div className="ob-chip-group">
                            {['LinkedIn', 'Google Search', 'Partner / Referral', 'Conference / Event', 'News / Press', 'Other'].map(h => (
                                <button
                                    key={h}
                                    type="button"
                                    className={`ob-chip ${companyData.hearAboutUs === h ? 'ob-chip--active' : ''}`}
                                    onClick={() => handleCompanyChange('hearAboutUs', h)}
                                >{h}</button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="ob-actions">
                <button className="ob-btn ob-btn--ghost" onClick={() => { setError(''); setStep(1); }}>
                    <ArrowLeft size={15} /> Back
                </button>
                <button className="ob-btn ob-btn--primary" onClick={handleFinish} disabled={loading}>
                    {loading ? 'Setting up...' : <><CheckCircle size={15} /> Launch Dashboard</>}
                </button>
            </div>
        </div>
    );

    return (
        <div className="ob-container">
            <div className="ob-card">
                {/* Header */}
                <div className="ob-header">
                    <img src={logo} alt="CapAble" className="ob-logo" />
                    <div className="ob-progress">
                        {Array.from({ length: totalSteps }, (_, i) => (
                            <div
                                key={i}
                                className={`ob-progress-dot ${i + 1 <= step ? 'ob-progress-dot--active' : ''}`}
                            />
                        ))}
                        <span className="ob-progress-label">Step {step} of {totalSteps}</span>
                    </div>
                </div>

                {error && <div className="ob-error">{error}</div>}

                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
            </div>
        </div>
    );
}
