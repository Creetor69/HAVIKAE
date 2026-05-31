
// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    if (!url) throw new Error('URL is required')

    console.log(`Fetching metadata for: ${url}`);

    // Basic validation
    let targetUrl = url;
    if (!targetUrl.startsWith('http')) {
        targetUrl = `https://${targetUrl}`;
    }

    // Attempt to fetch
    const response = await fetch(targetUrl, {
        headers: {
            // Pretend to be a real browser to avoid some bot blocks
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch site: ${response.status} ${response.statusText}`);
    }

    const html = await response.text()

    // Regex helpers to extract Open Graph tags
    const getMetaTag = (prop: string) => {
        const regex = new RegExp(`<meta[^>]+(?:property|name)=["'](?:og:)?${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
        const match = html.match(regex);
        return match ? match[1] : null;
    };

    const getTitle = () => {
        const ogTitle = getMetaTag('title');
        if (ogTitle) return ogTitle;
        const titleRegex = /<title[^>]*>([^<]+)<\/title>/i;
        const match = html.match(titleRegex);
        return match ? match[1] : '';
    };

    // Determine Source
    const hostname = new URL(targetUrl).hostname.replace('www.', '');
    let sourceName = getMetaTag('site_name') || hostname;
    
    // Fallbacks for Instagram/Facebook if scraping fails (they often return login pages to bots)
    let title = getTitle();
    let description = getMetaTag('description');
    let image = getMetaTag('image');

    if (hostname.includes('instagram.com')) {
        sourceName = 'Instagram';
        if (!title || title.includes('Login')) title = 'Instagram Post';
        // Instagram images expire or are blocked, but we'll try
    }
    if (hostname.includes('facebook.com')) {
        sourceName = 'Facebook';
        if (!title || title.includes('Log In')) title = 'Facebook Post';
    }
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        sourceName = 'YouTube';
    }

    const metadata = {
        title: title || sourceName,
        description: description || '',
        image: image || '', // If empty, frontend should handle fallback
        source: sourceName,
        url: targetUrl,
        // Detect video content from OG tags
        video: getMetaTag('video') || getMetaTag('video:secure_url') || null
    };

    return new Response(JSON.stringify(metadata), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Error in fetch-metadata:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
