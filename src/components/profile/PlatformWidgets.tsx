import React from 'react';
import './PlatformWidgets.css';
import { calculateCurrentStreak } from '../../services/leetcodeService';
import { Trash2 } from 'lucide-react';

export const LeetCodeWidget = ({ stats, onDisconnect }: { stats: any, onDisconnect?: () => void }) => {
    if (!stats) return null;

    const totalPercentage = stats.totalQuestions > 0 ? (stats.totalSolved / stats.totalQuestions) * 100 : 0;
    const strokeDasharray = `${totalPercentage}, 100`;
    const streak = calculateCurrentStreak(stats.submissionCalendar);

    // Approximate total active days by counting unique keys in submission calendar
    const activeDays = stats.submissionCalendar ? Object.keys(stats.submissionCalendar).length : 0;

    return (
        <div className="platform-widget">
            {onDisconnect && (
                <button className="pw-disconnect-btn" onClick={onDisconnect} title="Disconnect LeetCode">
                    <Trash2 size={16} />
                </button>
            )}
            <div className="lc-stats-row">
                <div className="lc-ring-container">
                    <svg className="lc-ring-svg" viewBox="0 0 36 36">
                        <path className="lc-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="lc-ring-fill" strokeDasharray={strokeDasharray} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="lc-ring-text">
                        <span className="lc-ring-value">{stats.totalSolved}</span>
                        <span className="lc-ring-label">Solved</span>
                    </div>
                </div>

                <div className="lc-diff-breakdown">
                    <div className="lc-diff-item">
                        <span className="lc-diff-label lc-diff-easy">Easy</span>
                        <span className="lc-diff-count">{stats.easySolved} / {stats.totalEasy}</span>
                    </div>
                    <div className="lc-diff-item">
                        <span className="lc-diff-label lc-diff-medium">Med.</span>
                        <span className="lc-diff-count">{stats.mediumSolved} / {stats.totalMedium}</span>
                    </div>
                    <div className="lc-diff-item">
                        <span className="lc-diff-label lc-diff-hard">Hard</span>
                        <span className="lc-diff-count">{stats.hardSolved} / {stats.totalHard}</span>
                    </div>
                </div>
            </div>

            <div className="lc-heatmap-section">
                <div className="lc-heatmap-header">
                    <span>{stats.totalSolved} submissions in the past one year</span>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <span>Total active days: <strong style={{color:'#fff'}}>{activeDays}</strong></span>
                        <span>Current streak: <strong style={{color:'#fff'}}>{streak}</strong></span>
                    </div>
                </div>
                {/* Simplified visual representation of the heatmap grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px', height: '60px', opacity: 0.5 }}>
                   <div style={{background: '#333', borderRadius: '2px'}}></div>
                   <div style={{background: '#333', borderRadius: '2px'}}></div>
                   <div style={{background: '#00b8a3', borderRadius: '2px'}}></div>
                   <div style={{background: '#333', borderRadius: '2px'}}></div>
                   <div style={{background: '#00b8a3', borderRadius: '2px'}}></div>
                   <div style={{background: '#333', borderRadius: '2px'}}></div>
                   <div style={{background: '#333', borderRadius: '2px'}}></div>
                   <div style={{background: '#ffc01e', borderRadius: '2px'}}></div>
                   <div style={{background: '#333', borderRadius: '2px'}}></div>
                   <div style={{background: '#00b8a3', borderRadius: '2px'}}></div>
                   <div style={{background: '#333', borderRadius: '2px'}}></div>
                   <div style={{background: '#333', borderRadius: '2px'}}></div>
                </div>
            </div>
        </div>
    );
};

export const GitHubWidget = ({ stats, username, onDisconnect }: { stats: any, username: string, onDisconnect?: () => void }) => {
    if (!stats) return null;

    return (
        <div className="platform-widget">
            {onDisconnect && (
                <button className="pw-disconnect-btn" onClick={onDisconnect} title="Disconnect GitHub">
                    <Trash2 size={16} />
                </button>
            )}
            <div className="gh-widget-header">
                <img src={stats.avatar_url} alt={username} className="gh-avatar" />
                <div className="gh-info">
                    <h3>{stats.name || username}</h3>
                    <p>@{username}</p>
                </div>
            </div>
            
            <div className="gh-stats-grid">
                <div className="gh-stat-box">
                    <span className="gh-stat-value">{stats.public_repos}</span>
                    <span className="gh-stat-label">Repositories</span>
                </div>
                <div className="gh-stat-box">
                    <span className="gh-stat-value">{stats.followers}</span>
                    <span className="gh-stat-label">Followers</span>
                </div>
                <div className="gh-stat-box">
                    <span className="gh-stat-value">{stats.following}</span>
                    <span className="gh-stat-label">Following</span>
                </div>
            </div>
        </div>
    );
};

export const LinkedInWidget = ({ url, onDisconnect }: { url: string, onDisconnect?: () => void }) => {
    if (!url) return null;
    
    // Extract username from url (e.g. https://linkedin.com/in/username)
    let username = url.split('/').filter(Boolean).pop() || 'Member';
    // Clean up username display
    username = username.split('?')[0].replace(/-/g, ' ');

    return (
        <div className="platform-widget li-widget">
            {onDisconnect && (
                <button className="pw-disconnect-btn" onClick={onDisconnect} title="Disconnect LinkedIn">
                    <Trash2 size={16} />
                </button>
            )}
            
            <div className="li-widget-header">
                <div className="li-banner"></div>
                <div className="li-avatar-wrapper">
                    <div className="li-avatar-placeholder">
                        {username.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>
            
            <div className="li-info">
                <h3 className="capitalize" style={{textTransform: 'capitalize'}}>{username}</h3>
                <p>Verified Professional <span className="li-verified-tick" style={{color: '#0a66c2'}}>✓</span></p>
                <a href={url} target="_blank" rel="noreferrer" className="li-view-btn">
                    View Profile
                </a>
            </div>
            
            <div className="li-stats-grid">
                <div className="li-stat-box">
                    <span className="li-stat-value">500+</span>
                    <span className="li-stat-label">Connections</span>
                </div>
                <div className="li-stat-box">
                    <span className="li-stat-value">Pro</span>
                    <span className="li-stat-label">Network</span>
                </div>
            </div>
        </div>
    );
};
