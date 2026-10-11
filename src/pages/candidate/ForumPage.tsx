import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import {
    getForumPosts, createForumPost, upvotePost, getReplies, addReply,
    upvoteReply, seedSampleForumPosts, incrementPostViews,
    type ForumPost, type ForumReply, type ForumCategory,
} from '../../services/communityService';
import {
    MessageSquare, ThumbsUp, Eye, Plus, X, Search, ChevronRight,
    Send, ArrowLeft, Loader2, Tag, Sparkles, Award, User, Clock, Filter,
} from 'lucide-react';
import './ForumPage.css';

const CATEGORIES: { value: ForumCategory | 'all'; label: string; emoji: string }[] = [
    { value: 'all', label: 'All', emoji: '🌐' },
    { value: 'placement_experience', label: 'Placement Experiences', emoji: '🏢' },
    { value: 'interview_tips', label: 'Interview Tips', emoji: '💡' },
    { value: 'company_reviews', label: 'Company Reviews', emoji: '⭐' },
    { value: 'career_advice', label: 'Career Advice', emoji: '🧭' },
    { value: 'off_campus', label: 'Off-Campus', emoji: '🌍' },
    { value: 'resume_help', label: 'Resume Help', emoji: '📄' },
    { value: 'coding', label: 'Coding', emoji: '💻' },
    { value: 'general', label: 'General', emoji: '💬' },
];

const CAT_COLORS: Record<string, string> = {
    placement_experience: '#10b981',
    interview_tips: '#f59e0b',
    company_reviews: '#6366f1',
    career_advice: '#8b5cf6',
    off_campus: '#2563eb',
    resume_help: '#ec4899',
    coding: '#06b6d4',
    general: '#64748b',
};

function timeAgo(ts: unknown): string {
    if (!ts) return '';
    let date: Date;
    if (typeof ts === 'object' && ts !== null && 'toDate' in ts) {
        date = (ts as any).toDate();
    } else {
        date = new Date(ts as any);
    }
    const secs = Math.floor((Date.now() - date.getTime()) / 1000);
    if (secs < 60) return 'just now';
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
}

export default function ForumPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const { user, dbUid, profile } = useAuth();
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<ForumCategory | 'all'>('all');
    const [search, setSearch] = useState('');
    const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
    const [replies, setReplies] = useState<ForumReply[]>([]);
    const [repliesLoading, setRepliesLoading] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [seeded, setSeeded] = useState(false);

    // Create form
    const [newPost, setNewPost] = useState({
        title: '',
        body: '',
        category: 'general' as ForumCategory,
        tags: '',
    });
    const [creating, setCreating] = useState(false);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getForumPosts(activeCategory === 'all' ? undefined : activeCategory, 30);
            setPosts(data);
            // Seed if empty
            if (data.length === 0 && !seeded && dbUid) {
                setSeeded(true);
                await seedSampleForumPosts(dbUid);
                const refreshed = await getForumPosts(undefined, 30);
                setPosts(refreshed);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [activeCategory, dbUid, seeded]);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const openPost = async (post: ForumPost) => {
        setSelectedPost(post);
        setRepliesLoading(true);
        incrementPostViews(post.id!).catch(() => {});
        const r = await getReplies(post.id!);
        setReplies(r);
        setRepliesLoading(false);
    };

    const handleUpvotePost = async (post: ForumPost, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!dbUid) return;
        const hasUpvoted = post.upvotedBy.includes(dbUid);
        await upvotePost(post.id!, dbUid, hasUpvoted);
        setPosts(prev => prev.map(p => p.id === post.id
            ? {
                ...p,
                upvotes: hasUpvoted ? p.upvotes - 1 : p.upvotes + 1,
                upvotedBy: hasUpvoted ? p.upvotedBy.filter(u => u !== dbUid) : [...p.upvotedBy, dbUid],
            }
            : p
        ));
        if (selectedPost?.id === post.id) {
            setSelectedPost(prev => prev ? {
                ...prev,
                upvotes: hasUpvoted ? prev.upvotes - 1 : prev.upvotes + 1,
                upvotedBy: hasUpvoted ? prev.upvotedBy.filter(u => u !== dbUid) : [...prev.upvotedBy, dbUid],
            } : null);
        }
    };

    const handleSendReply = async () => {
        if (!dbUid || !selectedPost || !replyText.trim()) return;
        setSendingReply(true);
        try {
            const replyId = await addReply(selectedPost.id!, {
                postId: selectedPost.id!,
                authorUid: dbUid,
                authorName: profile?.name || 'Anonymous',
                authorAvatar: profile?.avatar,
                authorRole: profile?.role,
                body: replyText.trim(),
            });
            const newReply: ForumReply = {
                id: replyId,
                postId: selectedPost.id!,
                authorUid: dbUid,
                authorName: profile?.name || 'Anonymous',
                authorAvatar: profile?.avatar,
                authorRole: profile?.role,
                body: replyText.trim(),
                upvotes: 0,
                upvotedBy: [],
                isAcceptedAnswer: false,
                createdAt: new Date(),
            };
            setReplies(prev => [...prev, newReply]);
            setSelectedPost(prev => prev ? { ...prev, replyCount: prev.replyCount + 1 } : null);
            setReplyText('');
        } finally {
            setSendingReply(false);
        }
    };

    const handleCreatePost = async () => {
        if (!dbUid || !newPost.title.trim() || !newPost.body.trim()) return;
        setCreating(true);
        try {
            await createForumPost({
                authorUid: dbUid,
                authorName: profile?.name || 'Anonymous',
                authorAvatar: profile?.avatar,
                authorRole: profile?.role,
                title: newPost.title.trim(),
                body: newPost.body.trim(),
                category: newPost.category,
                tags: newPost.tags.split(',').map(t => t.trim()).filter(Boolean),
            });
            setShowCreateModal(false);
            setNewPost({ title: '', body: '', category: 'general', tags: '' });
            fetchPosts();
        } finally {
            setCreating(false);
        }
    };

    const filteredPosts = posts.filter(p => {
        if (!search) return true;
        return p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.body.toLowerCase().includes(search.toLowerCase()) ||
            p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    });

    // Detail view
    if (selectedPost) {
        return (
            <div className="forum-page">
                {!isEmbedded && <FloatingNavbar variant="candidate" />}
                <div className="forum-container">
                    <button className="forum-back-btn" onClick={() => setSelectedPost(null)}>
                        <ArrowLeft size={16} /> Back to Forum
                    </button>

                    <motion.div className="forum-post-detail"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}>
                        <div className="forum-post-detail-header">
                            <div className="forum-post-cat-badge"
                                style={{
                                    background: CAT_COLORS[selectedPost.category] + '20',
                                    color: CAT_COLORS[selectedPost.category],
                                    border: `1px solid ${CAT_COLORS[selectedPost.category]}30`,
                                }}>
                                {CATEGORIES.find(c => c.value === selectedPost.category)?.emoji}
                                &nbsp;{CATEGORIES.find(c => c.value === selectedPost.category)?.label}
                            </div>
                            <h1 className="forum-post-detail-title">{selectedPost.title}</h1>
                            <div className="forum-post-detail-meta">
                                <div className="forum-post-author">
                                    <div className="forum-avatar">{selectedPost.authorName[0]}</div>
                                    <span>{selectedPost.authorName}</span>
                                    {selectedPost.authorRole && (
                                        <span className="forum-author-role">{selectedPost.authorRole}</span>
                                    )}
                                </div>
                                <span className="forum-meta-dot">·</span>
                                <span className="forum-meta-time">{timeAgo(selectedPost.createdAt)}</span>
                                <span className="forum-meta-dot">·</span>
                                <span className="forum-meta-views"><Eye size={13} /> {selectedPost.views} views</span>
                            </div>
                        </div>

                        <div className="forum-post-body">
                            {selectedPost.body.split('\n').map((line, i) => {
                                if (line.startsWith('**') && line.endsWith('**')) {
                                    return <p key={i}><strong>{line.slice(2, -2)}</strong></p>;
                                }
                                if (line.startsWith('- ')) {
                                    return <p key={i} className="forum-body-bullet">• {line.slice(2)}</p>;
                                }
                                return line ? <p key={i}>{line}</p> : <br key={i} />;
                            })}
                        </div>

                        {selectedPost.tags.length > 0 && (
                            <div className="forum-post-tags">
                                {selectedPost.tags.map(tag => (
                                    <span key={tag} className="forum-tag">#{tag}</span>
                                ))}
                            </div>
                        )}

                        <div className="forum-post-actions">
                            <button
                                className={`forum-upvote-btn ${selectedPost.upvotedBy.includes(dbUid || '') ? 'upvoted' : ''}`}
                                onClick={(e) => handleUpvotePost(selectedPost, e)}>
                                <ThumbsUp size={15} />
                                {selectedPost.upvotes} Upvotes
                            </button>
                            <span className="forum-reply-count">
                                <MessageSquare size={14} /> {selectedPost.replyCount} Replies
                            </span>
                            {selectedPost.isAnswered && (
                                <span className="forum-answered-badge">
                                    <Award size={14} /> Answered
                                </span>
                            )}
                        </div>
                    </motion.div>

                    {/* Replies */}
                    <div className="forum-replies-section">
                        <h3 className="forum-replies-title">
                            {selectedPost.replyCount} Replies
                        </h3>

                        {repliesLoading ? (
                            <div className="forum-loading"><Loader2 size={24} className="forum-spinner" /></div>
                        ) : (
                            <div className="forum-replies-list">
                                {replies.length === 0 ? (
                                    <div className="forum-no-replies">
                                        Be the first to reply to this post!
                                    </div>
                                ) : (
                                    replies.map((reply, i) => (
                                        <motion.div key={reply.id} className={`forum-reply ${reply.isAcceptedAnswer ? 'accepted' : ''}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}>
                                            {reply.isAcceptedAnswer && (
                                                <div className="forum-accepted-label">
                                                    <Award size={12} /> Accepted Answer
                                                </div>
                                            )}
                                            <div className="forum-reply-header">
                                                <div className="forum-avatar">{reply.authorName[0]}</div>
                                                <div>
                                                    <span className="forum-reply-author">{reply.authorName}</span>
                                                    {reply.authorRole && (
                                                        <span className="forum-author-role">{reply.authorRole}</span>
                                                    )}
                                                </div>
                                                <span className="forum-reply-time">{timeAgo(reply.createdAt)}</span>
                                            </div>
                                            <div className="forum-reply-body">{reply.body}</div>
                                            <button
                                                className={`forum-reply-upvote ${reply.upvotedBy.includes(dbUid || '') ? 'upvoted' : ''}`}
                                                onClick={async () => {
                                                    if (!dbUid) return;
                                                    const hasUpvoted = reply.upvotedBy.includes(dbUid);
                                                    await upvoteReply(selectedPost.id!, reply.id!, dbUid, hasUpvoted);
                                                    setReplies(prev => prev.map(r => r.id === reply.id
                                                        ? {
                                                            ...r,
                                                            upvotes: hasUpvoted ? r.upvotes - 1 : r.upvotes + 1,
                                                            upvotedBy: hasUpvoted ? r.upvotedBy.filter(u => u !== dbUid) : [...r.upvotedBy, dbUid],
                                                        }
                                                        : r
                                                    ));
                                                }}>
                                                <ThumbsUp size={12} />
                                                {reply.upvotes}
                                            </button>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Reply Input */}
                        <div className="forum-reply-input-section">
                            <div className="forum-avatar">{(profile?.name || 'U')[0]}</div>
                            <div className="forum-reply-input-wrapper">
                                <textarea
                                    className="forum-reply-textarea"
                                    placeholder="Share your thoughts, experience, or advice..."
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    rows={3} />
                                <button className="forum-send-btn"
                                    onClick={handleSendReply}
                                    disabled={sendingReply || !replyText.trim()}>
                                    {sendingReply
                                        ? <Loader2 size={16} className="forum-spinner" />
                                        : <Send size={16} />}
                                    Post Reply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // List view
    return (
        <div className="forum-page" style={isEmbedded ? { background: 'transparent' } : {}}>
            {!isEmbedded && <FloatingNavbar variant="candidate" />}
            <div className="forum-container">
                {/* Header */}
                <motion.div className="forum-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}>
                    <div>
                        <h1 className="forum-title">
                            <MessageSquare size={26} className="forum-title-icon" />
                            Community Forum
                        </h1>
                        <p className="forum-subtitle">Share experiences, ask questions, support each other</p>
                    </div>
                    <button className="forum-create-btn" onClick={() => setShowCreateModal(true)}>
                        <Plus size={18} /> New Post
                    </button>
                </motion.div>

                {/* Search */}
                <div className="forum-search-bar">
                    <Search size={16} className="forum-search-icon" />
                    <input className="forum-search-input"
                        placeholder="Search posts, topics, companies..."
                        value={search}
                        onChange={e => setSearch(e.target.value)} />
                </div>

                {/* Category Pills */}
                <div className="forum-categories">
                    {CATEGORIES.map(cat => (
                        <button key={cat.value}
                            className={`forum-cat-pill ${activeCategory === cat.value ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat.value)}
                            style={activeCategory === cat.value && cat.value !== 'all'
                                ? { background: CAT_COLORS[cat.value] + '20', borderColor: CAT_COLORS[cat.value] + '50', color: CAT_COLORS[cat.value] }
                                : {}}>
                            {cat.emoji} {cat.label}
                        </button>
                    ))}
                </div>

                {/* Posts */}
                {loading ? (
                    <div className="forum-loading">
                        <Loader2 size={28} className="forum-spinner" />
                        <p>Loading discussions...</p>
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="forum-empty">
                        <div className="forum-empty-icon">💬</div>
                        <h3>No posts yet</h3>
                        <p>Be the first to start a discussion in this category!</p>
                        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: 4 }}>Click <strong>+ New Post</strong> at the top to share your thoughts.</p>
                    </div>
                ) : (
                    <div className="forum-posts-list">
                        {filteredPosts.map((post, i) => (
                            <motion.div key={post.id} className="forum-post-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                onClick={() => openPost(post)}>
                                <div className="forum-post-card-left">
                                    <div className="forum-vote-col">
                                        <button
                                            className={`forum-upvote-mini ${post.upvotedBy.includes(dbUid || '') ? 'upvoted' : ''}`}
                                            onClick={(e) => handleUpvotePost(post, e)}>
                                            <ThumbsUp size={14} />
                                        </button>
                                        <span className="forum-vote-count">{post.upvotes}</span>
                                    </div>
                                    <div className="forum-post-card-content">
                                        <div className="forum-post-card-meta">
                                            <span className="forum-post-cat-badge"
                                                style={{
                                                    background: CAT_COLORS[post.category] + '18',
                                                    color: CAT_COLORS[post.category],
                                                }}>
                                                {CATEGORIES.find(c => c.value === post.category)?.emoji}
                                                &nbsp;{CATEGORIES.find(c => c.value === post.category)?.label}
                                            </span>
                                            {post.isAnswered && (
                                                <span className="forum-answered-small">✓ Answered</span>
                                            )}
                                            {post.isPinned && (
                                                <span className="forum-pinned-badge">📌 Pinned</span>
                                            )}
                                        </div>
                                        <h3 className="forum-post-card-title">{post.title}</h3>
                                        <p className="forum-post-card-preview">
                                            {post.body.replace(/\*\*/g, '').slice(0, 120)}...
                                        </p>
                                        <div className="forum-post-card-footer">
                                            <span className="forum-meta-author">
                                                <div className="forum-avatar-xs">{post.authorName[0]}</div>
                                                {post.authorName}
                                            </span>
                                            <span className="forum-meta-dot">·</span>
                                            <span className="forum-meta-time">{timeAgo(post.createdAt)}</span>
                                            <div className="forum-post-stats">
                                                <span><MessageSquare size={12} /> {post.replyCount}</span>
                                                <span><Eye size={12} /> {post.views}</span>
                                            </div>
                                            <div className="forum-post-tags-inline">
                                                {post.tags.slice(0, 2).map(t => (
                                                    <span key={t} className="forum-tag-xs">#{t}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="forum-post-arrow" />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Post Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div className="forum-modal-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setShowCreateModal(false)}>
                        <motion.div className="forum-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}>
                            <div className="forum-modal-header">
                                <h2><Sparkles size={18} /> New Discussion Post</h2>
                                <button onClick={() => setShowCreateModal(false)}><X size={20} /></button>
                            </div>
                            <div className="forum-modal-body">
                                <div className="forum-form-group">
                                    <label>Title *</label>
                                    <input className="forum-input"
                                        placeholder="What would you like to discuss?"
                                        value={newPost.title}
                                        onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))} />
                                </div>
                                <div className="forum-form-group">
                                    <label>Category</label>
                                    <select className="forum-select"
                                        value={newPost.category}
                                        onChange={e => setNewPost(p => ({ ...p, category: e.target.value as ForumCategory }))}>
                                        {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                                            <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="forum-form-group">
                                    <label>Content *</label>
                                    <textarea className="forum-textarea"
                                        placeholder="Share your experience, ask your question, or provide advice..."
                                        value={newPost.body}
                                        onChange={e => setNewPost(p => ({ ...p, body: e.target.value }))}
                                        rows={8} />
                                </div>
                                <div className="forum-form-group">
                                    <label>Tags (comma-separated)</label>
                                    <input className="forum-input"
                                        placeholder="e.g. amazon, react, placement, tips"
                                        value={newPost.tags}
                                        onChange={e => setNewPost(p => ({ ...p, tags: e.target.value }))} />
                                </div>
                            </div>
                            <div className="forum-modal-footer">
                                <button className="forum-btn-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button className="forum-btn-post" onClick={handleCreatePost}
                                    disabled={creating || !newPost.title.trim() || !newPost.body.trim()}>
                                    {creating ? <Loader2 size={16} className="forum-spinner" /> : <Send size={16} />}
                                    Post Discussion
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
