
import React, { useState, useEffect } from 'react';
import { BlogPost, User, Page, PageContext } from '../types';
import { supabase } from '../supabaseClient';
import { marked } from 'marked';
import LoadingSpinner from '../components/LoadingSpinner';
import CommentSection from '../components/CommentSection';
import VideoPlayer from '../components/VideoPlayer';

interface BlogPostPageProps {
  slug: string;
  user: User | null;
  navigateTo: (page: Page, context?: PageContext) => void;
}

const BlogPostPage: React.FC<BlogPostPageProps> = ({ slug, user, navigateTo }) => {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*, profiles(name)')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();
      
      if (fetchError || !data) {
        console.error("Error fetching post:", fetchError);
        navigateTo('notFound');
      } else {
        setPost(data as BlogPost);
      }
      setLoading(false);
    };

    fetchPost();
    window.scrollTo(0, 0);
  }, [slug, navigateTo]);

  // Effect to load Instagram embed script if needed
  useEffect(() => {
    if (post?.embed_code?.includes('instagram.com')) {
        if ((window as any).instgrm) {
            (window as any).instgrm.Embeds.process();
        } else {
            const script = document.createElement('script');
            script.src = "//www.instagram.com/embed.js";
            script.async = true;
            document.body.appendChild(script);
        }
    }
  }, [post]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hav-cream">
        <LoadingSpinner />
      </div>
    );
  }

  if (!post) {
    return <div className="min-h-screen flex items-center justify-center bg-hav-cream"><LoadingSpinner /></div>;
  }

  // Determine if we should show a video player (YouTube/Direct) OR a social embed
  const isEmbed = !!post.embed_code;
  const videoSource = !isEmbed && (post.video_url || 
    (post.post_type === 'link' && post.external_url && 
    (post.external_url.includes('youtube') || post.external_url.includes('youtu.be'))))
    ? (post.video_url || post.external_url) : null;

  return (
    <div className="bg-hav-cream py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-hav-orange-900 leading-tight">
            {post.title}
          </h1>
          <div className="my-4 text-sm text-gray-500">
            <span>By {post.profiles?.name || 'Havikar'}</span>
            <span className="mx-2">&bull;</span>
            <span>Published on {new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
            {post.post_type === 'link' && post.external_meta?.site_name && (
                <>
                    <span className="mx-2">&bull;</span>
                    <span className="uppercase font-bold text-hav-orange-700">Via {post.external_meta.site_name}</span>
                </>
            )}
          </div>

          {isEmbed ? (
              <div className="my-8 flex justify-center">
                  {/* Container for Social Embeds */}
                  <div 
                      dangerouslySetInnerHTML={{ __html: post.embed_code! }} 
                      className="w-full flex justify-center overflow-hidden"
                  />
              </div>
          ) : videoSource ? (
              <div className="my-8">
                  <VideoPlayer url={videoSource} />
              </div>
          ) : post.featured_image_url ? (
            <img 
              src={post.featured_image_url} 
              alt={post.title} 
              className="w-full h-auto rounded-lg shadow-lg my-8"
            />
          ) : post.external_meta?.image && (
             <img 
              src={post.external_meta.image} 
              alt={post.title} 
              className="w-full h-auto rounded-lg shadow-lg my-8"
            />
          )}

          {post.content && (
            <div
                className="prose lg:prose-xl max-w-none text-hav-brown prose-headings:text-hav-orange-900 prose-headings:font-serif prose-strong:text-hav-brown prose-a:text-hav-orange-600 hover:prose-a:text-hav-orange-800"
                dangerouslySetInnerHTML={{ __html: marked.parse(post.content) as string }}
            />
          )}
          
          {post.post_type === 'link' && post.external_url && (
              <div className="mt-8 p-6 bg-hav-orange-50 rounded-lg border border-hav-orange-200 text-center">
                  <p className="text-hav-brown mb-4 font-semibold">View original post on source platform</p>
                  <a 
                    href={post.external_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block bg-hav-orange-600 text-white font-bold py-3 px-8 rounded-full hover:bg-hav-orange-700 transition-colors shadow-lg"
                  >
                      Open {post.external_meta?.site_name || 'Link'}
                  </a>
              </div>
          )}
          
          <hr className="my-12 border-t-2 border-hav-orange-100" />
          
          <CommentSection postId={post.id} user={user} />
        </div>
      </div>
    </div>
  );
};

export default BlogPostPage;
