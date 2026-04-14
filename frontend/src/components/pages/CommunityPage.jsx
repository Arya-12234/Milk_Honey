import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { mlAPI } from '../../services/api';
import './CommunityPage.css';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'general', label: 'General' },
  { value: 'disease', label: 'Plant Disease' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'soil', label: 'Soil Health' },
  { value: 'pest', label: 'Pest Control' },
  { value: 'yield', label: 'Yield' },
  { value: 'weather', label: 'Weather' },
];

const RESOURCE_ICONS = { guide: '📖', course: '🎓', video: '🎬', pdf: '📄' };

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function CommunityPage() {
  const [data, setData]       = useState(null);
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCat]    = useState('');
  const [search, setSearch]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', body: '', category: 'general' });
  const [submitting, setSubmitting] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const [reply, setReply]     = useState('');

  useEffect(() => {
    mlAPI.getCommunityDashboard()
      .then(({ data }) => { setData(data); setPosts(data.recent_posts); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async () => {
    const { data } = await mlAPI.getForumPosts({ category, q: search });
    setPosts(data);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: post } = await mlAPI.createForumPost(newPost);
      setPosts(p => [post, ...p]);
      setShowForm(false);
      setNewPost({ title: '', body: '', category: 'general' });
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleReply = async (postId) => {
    if (!reply.trim()) return;
    await mlAPI.replyToPost(postId, reply);
    setReply('');
    const { data } = await mlAPI.getForumPost(postId);
    setActivePost(data);
  };

  const handleUpvote = async (model, id) => {
    await mlAPI.upvote(model, id);
  };

  return (
    <DashboardLayout>
      <div className="comm-page">
        <div className="comm-header">
          <h1 className="comm-title">Community Support</h1>
          <button className="btn-teal-sm" onClick={() => setShowForm(!showForm)}>
            + New Post
          </button>
        </div>

        {/* AI Recommendation banner */}
        {data?.ai_recommendation && (
          <div className="ai-rec-banner">
            <span className="ai-rec-icon">🤖</span>
            <div>
              <strong>AI recommendation based on your last scan:</strong>
              <p>{data.ai_recommendation.disease.replace(/_/g, ' ')} detected at {(data.ai_recommendation.confidence * 100).toFixed(0)}% confidence. {data.ai_recommendation.recommendation}</p>
            </div>
          </div>
        )}

        <div className="comm-grid">
          {/* Left: Forum */}
          <div className="comm-main">
            {/* Search + filters */}
            <div className="forum-controls">
              <input className="forum-search" placeholder="Search discussions..."
                value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              <select className="forum-cat-select" value={category} onChange={e => { setCat(e.target.value); handleSearch(); }}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {/* New post form */}
            {showForm && (
              <form className="new-post-form card" onSubmit={handlePost}>
                <h3>New Discussion</h3>
                <div className="form-row-2">
                  <input placeholder="Title" value={newPost.title}
                    onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))} required />
                  <select value={newPost.category} onChange={e => setNewPost(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.slice(1).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <textarea rows={4} placeholder="Share your question or experience..."
                  value={newPost.body}
                  onChange={e => setNewPost(p => ({ ...p, body: e.target.value }))} required />
                <div className="form-actions">
                  <button type="submit" className="btn-teal-sm" disabled={submitting}>
                    {submitting ? 'Posting…' : 'Post'}
                  </button>
                  <button type="button" className="btn-ghost-sm" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            )}

            {/* Post list */}
            {loading ? (
              <div className="comm-loading"><span className="spinner" style={{ borderTopColor: '#3AAFA9' }} /></div>
            ) : posts.length === 0 ? (
              <div className="comm-empty">
                <p>No discussions yet. Start the first one!</p>
              </div>
            ) : (
              <div className="forum-posts">
                {posts.map(post => (
                  <div key={post.id} className="forum-post-card card" onClick={() => setActivePost(post)}>
                    <div className="post-header">
                      <span className="post-cat-badge">{post.category_display}</span>
                      {post.is_pinned && <span className="pinned-badge">📌 Pinned</span>}
                    </div>
                    <h4 className="post-title">{post.title}</h4>
                    <p className="post-body-preview">{post.body.slice(0, 120)}{post.body.length > 120 ? '…' : ''}</p>
                    <div className="post-footer">
                      <span className="post-author">{post.author_name}</span>
                      <span className="post-time">{timeAgo(post.created_at)}</span>
                      <span className="post-replies">{post.reply_count} replies</span>
                      <button className="upvote-btn" onClick={e => { e.stopPropagation(); handleUpvote('post', post.id); }}>
                        ▲ {post.upvotes}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Post detail modal */}
            {activePost && (
              <div className="post-detail-overlay" onClick={() => setActivePost(null)}>
                <div className="post-detail card" onClick={e => e.stopPropagation()}>
                  <button className="close-btn" onClick={() => setActivePost(null)}>✕</button>
                  <span className="post-cat-badge">{activePost.post?.category_display}</span>
                  <h2>{activePost.post?.title}</h2>
                  <p className="post-full-body">{activePost.post?.body}</p>
                  <div className="replies-section">
                    <h4>Replies ({activePost.replies?.length || 0})</h4>
                    {activePost.replies?.map(r => (
                      <div key={r.id} className="reply-card">
                        <strong>{r.author_name}</strong>
                        <span className="reply-time">{timeAgo(r.created_at)}</span>
                        <p>{r.body}</p>
                      </div>
                    ))}
                    <div className="reply-form">
                      <textarea rows={2} placeholder="Write a reply…" value={reply}
                        onChange={e => setReply(e.target.value)} />
                      <button className="btn-teal-sm" onClick={() => handleReply(activePost.post?.id)}>Reply</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: sidebar */}
          <div className="comm-sidebar">
            {/* Resources */}
            <div className="sidebar-section card">
              <h3>Training resources</h3>
              {data?.resources?.length === 0 && <p className="sidebar-empty">No resources yet.</p>}
              {data?.resources?.map(r => (
                <div key={r.id} className="resource-row">
                  <span>{RESOURCE_ICONS[r.resource_type] || '📄'}</span>
                  <div>
                    <div className="res-title">{r.title}</div>
                    {r.url && <a href={r.url} className="res-link" target="_blank" rel="noreferrer">Open →</a>}
                  </div>
                </div>
              ))}
            </div>

            {/* Leaderboard */}
            <div className="sidebar-section card">
              <h3>Top contributors</h3>
              {data?.top_contributors?.length === 0 && <p className="sidebar-empty">No contributors yet.</p>}
              {data?.top_contributors?.map((c, i) => (
                <div key={c.user} className="contrib-row">
                  <span className="contrib-rank">#{i + 1}</span>
                  <div className="contrib-info">
                    <div className="contrib-name">{c.user_name}</div>
                    <div className="contrib-count">{c.total} contributions</div>
                  </div>
                  {c.badge && <span className="contrib-badge">{c.badge}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
