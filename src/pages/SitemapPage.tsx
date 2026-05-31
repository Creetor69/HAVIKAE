

import React from 'react';

const sitemapXmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  
  <!-- Main Pages -->
  <url>
    <loc>https://www.havikar.com/</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.00</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/shop</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.90</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/recipes</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.90</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/blog</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/about</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.70</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/contact</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.60</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/influencer</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.60</priority>
  </url>

  <!-- Category Pages -->
  <url>
    <loc>https://www.havikar.com/shop/Snacks</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/shop/Spice%20Blends</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/shop/Drinks</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>

  <!-- Product Pages -->
  <url>
    <loc>https://www.havikar.com/product/antina-unde</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/product/avalakki-chivda</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/product/bisibelebath-powder</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/product/chutney-pudi</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/product/gojjavalakki-mix</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/product/havishta-chips</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/product/instant-sambar-premix</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/product/kashaya-powder</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/product/kodbale</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/product/menthe-hittu</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/product/multi-seed-protein-drink</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/product/nippattu</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/product/puliyogare-gojju</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/product/rasam-powder</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/product/sambar-powder</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/product/sattvic-cooling-drink</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/product/vegan-herbal-drink</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.80</priority>
  </url>

  <!-- Recipe Pages -->
  <url>
    <loc>https://www.havikar.com/recipeDetail/bisibelebath</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.70</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/recipeDetail/rasam</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.70</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/recipeDetail/puliyogare</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.70</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/recipeDetail/sambar</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.70</priority>
  </url>

  <!-- Legal Pages -->
  <url>
    <loc>https://www.havikar.com/legal/privacy-policy</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.30</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/legal/terms-and-conditions</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.30</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/legal/shipping-policy</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.30</priority>
  </url>
  <url>
    <loc>https://www.havikar.com/legal/disclaimer</loc>
    <lastmod>2024-07-22</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.30</priority>
  </url>

</urlset>
`;

const SitemapPage: React.FC = () => {
  // This component renders the sitemap content in a <pre> tag
  // to make it appear as a plain text file in the browser.
  // Note: The content-type will still be text/html.
  return (
    <pre style={{
      whiteSpace: 'pre-wrap', 
      wordBreak: 'break-all', 
      fontFamily: 'monospace',
      margin: 0,
    }}>
      {sitemapXmlContent.trim()}
    </pre>
  );
};

export default SitemapPage;