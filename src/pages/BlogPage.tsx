
import React from 'react';
import { BlogPost, Page, PageContext } from '../types';
import VideoPlayer from '../components/VideoPlayer';

interface BlogPageProps {
  posts: BlogPost[];
  navigateTo: (page: Page, context?: PageContext) => void;
}

const BlogPostCard: React.FC<{ post: BlogPost, navigateTo: BlogPageProps['navigateTo'] }> = ({ post, navigateTo }) => {
    // Render Link/Social Card (The "Mini Instagram" view)
    if (post.post_type === 'link') {
        const meta = post.external_meta || {};
        const sourceName = meta.site_name || new URL(post.external_url || '').hostname.replace('www.', '');
        const hasVideo = post.video_url || (post.external_url && (post.external_url.includes('youtube') || post.external_url.includes('instagram') || post.external_url.includes('facebook')));

        return (
            <div 
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group flex flex-col border border-hav-olive/10 h-full"
            >
                <div className="bg-hav-orange-50 px-4 py-2 border-b border-hav-orange-100 flex items-center justify-between">
                     <span className="text-xs font-bold text-hav-orange-800 uppercase tracking-wide">
                        {sourceName}
                    </span>
                    <span className="text-xs text-gray-500">
                        {new Date(post.published_at || post.created_at).toLocaleDateString()}
                    </span>
                </div>

                {/* Video Area */}
                {hasVideo ? (
                    <div className="w-full bg-black">
                        <VideoPlayer url={post.video_url || post.external_url || ''} className="rounded-none border-0" />
                    </div>
                ) : meta.image ? (
                    <div className="h-64 overflow-hidden relative cursor-pointer" onClick={() => navigateTo('blogPost', { blogPostSlug: post.slug })}>
                        <img src={meta.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                ) : (
                    <div className="h-48 bg-hav-orange-100 flex items-center justify-center cursor-pointer" onClick={() => navigateTo('blogPost', { blogPostSlug: post.slug })}>
                        <span className="text-hav-orange-800 font-bold text-xl">{sourceName} Post</span>
                    </div>
                )}

                <div className="p-5 flex flex-col flex-grow">
                    <h2 
                        className="text-lg font-bold text-gray-900 leading-tight mb-2 cursor-pointer hover:text-hav-orange-600"
                        onClick={() => navigateTo('blogPost', { blogPostSlug: post.slug })}
                    >
                        {post.title}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1 flex-grow line-clamp-3">
                        {meta.description || post.content || 'Check out this post.'}
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-xs text-gray-400">
                            Shared by {post.profiles?.name || 'Havikar'}
                        </span>
                        <a 
                            href={post.external_url || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-full transition-colors flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            Open on {sourceName} &rarr;
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // Render Standard Article Card (Long form content)
    const excerpt = post.content ? post.content.substring(0, 150) + '...' : 'No content available.';
    return (
        <div 
            className="bg-hav-orange-50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group flex flex-col cursor-pointer border border-hav-olive/10 h-full"
            onClick={() => navigateTo('blogPost', { blogPostSlug: post.slug })}
        >
            {post.video_url ? (
                 <div className="w-full bg-black">
                    <VideoPlayer url={post.video_url} className="rounded-none border-0" />
                </div>
            ) : post.featured_image_url && (
                <div className="h-56 overflow-hidden">
                    <img src={post.featured_image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
            )}
            <div className="p-6 flex flex-col flex-grow">
                <h2 className="text-2xl font-serif font-bold text-hav-orange-800">{post.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                    By {post.profiles?.name || 'Havikar'} on {new Date(post.published_at || post.created_at).toLocaleDateString()}
                </p>
                <p className="mt-4 text-hav-brown flex-grow line-clamp-3">{excerpt}</p>
                <div className="mt-4">
                    <span className="font-semibold text-hav-orange-600 group-hover:underline">Read Article &rarr;</span>
                </div>
            </div>
        </div>
    )
};

const BlogPage: React.FC<BlogPageProps> = ({ posts, navigateTo }) => {
  return (
    <div className="bg-hav-cream min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-hav-orange-900">Havikar Journal</h1>
          <p className="mt-2 text-lg text-hav-brown">Stories, recipes, and social updates from our world.</p>
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
            {posts.map(post => (
              <BlogPostCard key={post.id} post={post} navigateTo={navigateTo} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-hav-orange-800">No Posts Yet</h2>
            <p className="text-hav-brown mt-2">Our journal is currently empty. Please check back soon for updates!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
