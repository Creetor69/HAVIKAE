
import React, { useState, useEffect } from 'react';
import { BlogPost, BlogPostInsert, BlogPostUpdate } from '../types';
import { marked } from 'marked';
import { XIcon } from './Icons';
import { supabase } from '../supabaseClient';

interface BlogEditorModalProps {
  post: BlogPost | null;
  onSave: (data: BlogPostInsert | BlogPostUpdate, id?: string) => Promise<boolean>;
  onClose: () => void;
}

const modalInputStyles = "mt-1 block w-full border border-hav-orange-200 rounded-md shadow-sm py-2 px-3 bg-white text-hav-brown placeholder:text-hav-brown/60 focus:outline-none focus:ring-hav-orange-500 focus:border-hav-orange-500";

const BlogEditorModal: React.FC<BlogEditorModalProps> = ({ post, onSave, onClose }) => {
    const [mode, setMode] = useState<'article' | 'link'>(post?.post_type || 'article');
    const [platform, setPlatform] = useState<'instagram' | 'facebook' | 'youtube' | 'other'>('instagram');
    const [formData, setFormData] = useState({
        title: post?.title || '',
        slug: post?.slug || '',
        content: post?.content || '',
        featured_image_url: post?.featured_image_url || '',
        video_url: post?.video_url || '',
        embed_code: post?.embed_code || '',
        is_published: post?.is_published ?? false,
        external_url: post?.external_url || '',
        external_meta: post?.external_meta || { title: '', description: '', image: '', site_name: '' },
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isFetchingMeta, setIsFetchingMeta] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        // @ts-ignore
        const checked = e.target.checked;
        
        if (name.startsWith('meta_')) {
            const field = name.replace('meta_', '');
            setFormData(prev => ({
                ...prev,
                external_meta: { ...prev.external_meta, [field]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
        }
    };
    
    useEffect(() => {
        if (!post) { 
            const newSlug = formData.title
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-') 
                .replace(/[^\w-]+/g, '') 
                .replace(/--+/g, '-'); 
            setFormData(prev => ({ ...prev, slug: newSlug }));
        }
    }, [formData.title, post]);

    const fetchMetadata = async () => {
        if (!formData.external_url) {
            alert("Please enter a URL first.");
            return;
        }
        setIsFetchingMeta(true);
        try {
            const response = await fetch('/api/admin/fetch-metadata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: formData.external_url })
            });

            if (!response.ok) throw new Error("Metadata fetch failed");
            
            const data = await response.json();

            if (data) {
                setFormData(prev => ({
                    ...prev,
                    title: prev.title || data.title,
                    content: prev.content || data.description || '',
                    video_url: data.video || prev.video_url, 
                    featured_image_url: data.image || prev.featured_image_url,
                    external_meta: {
                        title: data.title || '',
                        description: data.description || '',
                        image: data.image || '',
                        site_name: data.source || new URL(formData.external_url).hostname
                    }
                }));
            }
        } catch (err: any) {
            console.error("Error fetching metadata:", err);
        } finally {
            setIsFetchingMeta(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let finalEmbedCode = formData.embed_code;
            
            if (mode === 'link' && platform === 'instagram' && formData.external_url && !formData.embed_code) {
                const instaUrl = formData.external_url.split('?')[0];
                finalEmbedCode = `<blockquote class="instagram-media" data-instgrm-permalink="${instaUrl}?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14" style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"></blockquote><script async src="//www.instagram.com/embed.js"></script>`;
            }

            const payload: any = {
                title: formData.title,
                slug: formData.slug,
                content: formData.content,
                featured_image_url: formData.featured_image_url,
                is_published: formData.is_published,
                post_type: mode,
                video_url: formData.video_url.trim() || null,
                embed_code: finalEmbedCode.trim() || null,
                external_url: mode === 'link' ? formData.external_url : null,
                external_meta: mode === 'link' ? formData.external_meta : null,
            };

            if (post) { 
                if (post.is_published && formData.is_published) {
                    payload.published_at = post.published_at;
                } else if (!post.is_published && formData.is_published) {
                    payload.published_at = new Date().toISOString();
                } else {
                    payload.published_at = null;
                }
            } else {
                payload.published_at = formData.is_published ? new Date().toISOString() : null;
            }

            const success = await onSave(payload, post?.id);
            if (success) onClose();
        } catch (error) {
            console.error("Save failed in modal:", error);
            alert("Failed to prepare data for saving.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-6xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-2xl font-serif font-bold text-hav-orange-900">{post ? 'Edit' : 'Create'} Post</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><XIcon className="w-5 h-5"/></button>
                </div>

                <div className="flex gap-4 mb-6 border-b border-hav-orange-200">
                    <button onClick={() => setMode('article')} className={`pb-2 px-4 font-bold ${mode === 'article' ? 'border-b-2 border-hav-orange-600 text-hav-orange-900' : 'text-gray-500'}`}>Write Article</button>
                    <button onClick={() => setMode('link')} className={`pb-2 px-4 font-bold ${mode === 'link' ? 'border-b-2 border-hav-orange-600 text-hav-orange-900' : 'text-gray-500'}`}>Share Link (Social/Video)</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow min-h-0">
                    <div className="space-y-4 overflow-y-auto pr-3">
                        {mode === 'link' && (
                            <div className="bg-hav-orange-50 p-4 rounded-md border border-hav-orange-200 mb-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Platform</label>
                                    <select value={platform} onChange={e => setPlatform(e.target.value as any)} className={modalInputStyles}>
                                        <option value="instagram">Instagram</option>
                                        <option value="facebook">Facebook</option>
                                        <option value="youtube">YouTube</option>
                                        <option value="other">Other Link</option>
                                    </select>
                                </div>
                                {platform === 'instagram' && (
                                    <div>
                                        <label className="block text-sm font-bold mb-1">Instagram Post URL</label>
                                        <input name="external_url" value={formData.external_url || ''} onChange={handleChange} className={modalInputStyles} placeholder="https://www.instagram.com/p/..." />
                                    </div>
                                )}
                                {platform === 'facebook' && (
                                    <div>
                                        <label className="block text-sm font-bold mb-1">Facebook Embed Code</label>
                                        <textarea name="embed_code" value={formData.embed_code || ''} onChange={handleChange} className={`${modalInputStyles} font-mono text-xs`} rows={5} placeholder='<iframe src="..." ...></iframe>' />
                                    </div>
                                )}
                                {platform === 'youtube' && (
                                    <div>
                                        <label className="block text-sm font-bold mb-1">YouTube Video URL</label>
                                        <input name="video_url" value={formData.video_url || ''} onChange={handleChange} className={modalInputStyles} placeholder="https://youtu.be/..." />
                                    </div>
                                )}
                                {platform === 'other' && (
                                    <div>
                                        <label className="block text-sm font-bold mb-1">External Link URL</label>
                                        <div className="flex gap-2">
                                            <input name="external_url" value={formData.external_url || ''} onChange={handleChange} className={modalInputStyles} placeholder="https://..." />
                                            <button onClick={fetchMetadata} disabled={isFetchingMeta} className="bg-hav-orange-600 text-white px-3 py-2 rounded-md font-bold text-sm whitespace-nowrap disabled:bg-gray-400">{isFetchingMeta ? '...' : 'Fetch Info'}</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div><label className="block text-sm font-medium">Title</label><input name="title" value={formData.title} onChange={handleChange} className={modalInputStyles} /></div>
                        <div><label className="block text-sm font-medium">URL Slug</label><input name="slug" value={formData.slug} onChange={handleChange} className={modalInputStyles} /></div>
                        <div><label className="block text-sm font-medium">Featured Image URL</label><input name="featured_image_url" value={formData.featured_image_url || ''} onChange={handleChange} className={modalInputStyles} /></div>
                        
                        {mode === 'article' && (
                            <div><label className="block text-sm font-medium">Content (Markdown)</label><textarea name="content" value={formData.content || ''} onChange={handleChange} className={`${modalInputStyles} font-mono text-sm min-h-[300px]`} rows={15}></textarea></div>
                        )}
                    </div>

                    <div className="flex flex-col min-h-0">
                        <label className="block text-sm font-medium mb-1">Live Preview</label>
                        <div className="w-full h-full border border-hav-orange-200 rounded-md p-4 overflow-y-auto bg-hav-orange-50/50">
                            {mode === 'article' ? (
                                <div className="prose max-w-none">
                                    {formData.featured_image_url && <img src={formData.featured_image_url} alt="Featured" className="rounded-md" />}
                                    <h1>{formData.title || "Your Title Here"}</h1>
                                    <div dangerouslySetInnerHTML={{ __html: marked.parse(formData.content || '') as string }} />
                                </div>
                            ) : (
                                <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg">
                                    {formData.external_meta?.image ? <img src={formData.external_meta.image} alt="Link Preview" className="w-full h-48 object-cover" /> : <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-500">No Image</div>}
                                    <div className="p-4">
                                        <h3 className="font-bold text-lg text-gray-900 leading-tight mb-2">{formData.title || formData.external_meta?.title}</h3>
                                        <p className="text-sm text-gray-600 line-clamp-3">{formData.external_meta?.description}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-between items-center gap-3 flex-shrink-0">
                    <label className="flex items-center"><input name="is_published" type="checkbox" checked={formData.is_published} onChange={handleChange} className="h-5 w-5 rounded text-hav-orange-600" /><span className="ml-2 font-semibold">{formData.is_published ? 'Published' : 'Save as Draft'}</span></label>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-full">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving} className="bg-hav-orange-600 hover:bg-hav-orange-700 text-white font-bold py-2 px-4 rounded-full disabled:bg-hav-orange-300">{isSaving ? 'Saving...' : 'Save Post'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogEditorModal;
