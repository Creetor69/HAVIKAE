import { Product } from '../types';

// This data is a fallback and example structure.
// The live site will fetch data from Supabase.
export const productsData: Product[] = [
    {
        id: 'bisibelebath-powder',
        created_at: '2024-01-01T12:00:00Z',
        name: 'Bisibelebath Powder',
        tagline: 'The heart of a classic Karnataka one-pot meal.',
        description: 'A traditional, aromatic blend of roasted spices that gives Bisibelebath its signature flavour and colour. Made in small batches for perfect taste. Our authentic recipe ensures a rich, complex flavor that is both spicy and tangy, transforming a simple rice and lentil dish into a festive meal.',
        gst_rate: 5,
        image_urls: ['https://static.wixstatic.com/media/88c0f0_057efa3302224647852c51d6c8e9c8a9~mv2.png'],
        categories: null, // This will be populated by the join
        category_id: 'spice-blends-uuid', // Example UUID
        spice_level: 'Medium',
        is_vegan: true,
        is_sponsored: false,
        is_active: true,
        ingredients: ['Coriander Seeds', 'Red Chillies', 'Cinnamon', 'Cloves', 'Fenugreek Seeds', 'Copra', 'Spices'],
        how_to_use: 'Cook rice and toor dal. In a separate pot, cook vegetables. Add this powder, tamarind extract, and the cooked rice/dal mixture. Simmer and serve hot with ghee.',
        benefits: 'Rich in aromatic spices, facilitates easy digestion and provides traditional warmth.',
        nutrition: [
            { key: 'Serving Size', value: '1 tbsp (10g)' },
            { key: 'Calories', value: '35 kcal' },
            { key: 'Protein', value: '1g' },
        ],
        pairs_well_with: ['rasam-powder', 'havishta-chips'],
        average_rating: 4.8,
        review_count: 25,
        // FIX: Renamed 'variants' to 'product_variants' to match the Product type.
        product_variants: [
            { id: 'variant-uuid-1a', product_id: 'bisibelebath-powder', net_weight: '100g', price: 120, mrp: 125, stock_quantity: 53, created_at: '2024-01-01T12:00:00Z' },
            { id: 'variant-uuid-1b', product_id: 'bisibelebath-powder', net_weight: '250g', price: 280, mrp: 300, stock_quantity: 25, created_at: '2024-01-01T12:00:00Z' }
        ],
        // FIX: Add missing properties to conform to Product type
        meta_title: null,
        meta_description: null,
        meta_keywords: null,
    },
    {
        id: 'havishta-chips',
        created_at: '2024-01-01T12:00:00Z',
        name: 'Havishta Chips',
        tagline: 'Crispy, light, and irresistibly delicious.',
        description: 'Handmade banana chips, thinly sliced from Nendran bananas and fried to golden perfection in pure coconut oil. A classic snack, lightly salted and perfectly crunchy.',
        gst_rate: 5,
        image_urls: ['https://static.wixstatic.com/media/88c0f0_dd8692095f6843929497e7804efb51c4~mv2.png'],
        categories: null,
        category_id: 'snacks-uuid', // Example UUID
        spice_level: 'None',
        is_vegan: true,
        is_sponsored: false,
        is_active: true,
        ingredients: ['Raw Nendran Bananas', 'Coconut Oil', 'Salt'],
        how_to_use: 'Enjoy as a standalone snack or as a side with meals like Rasam rice or Bisibelebath.',
        benefits: 'Natural energy from Nendran bananas, heart-healthy fats from pure coconut oil.',
        nutrition: [
            { key: 'Serving Size', value: '30g' },
            { key: 'Calories', value: '150 kcal' },
            { key: 'Fat', value: '9g' },
        ],
        pairs_well_with: ['bisibelebath-powder', 'rasam-powder'],
        average_rating: 5.0,
        review_count: 55,
        // FIX: Renamed 'variants' to 'product_variants' to match the Product type.
        product_variants: [
             { id: 'variant-uuid-2a', product_id: 'havishta-chips', net_weight: '150g', price: 80, mrp: 85, stock_quantity: 110, created_at: '2024-01-01T12:00:00Z' }
        ],
        // FIX: Add missing properties to conform to Product type
        meta_title: null,
        meta_description: null,
        meta_keywords: null,
    },
     {
        id: 'antina-unde',
        created_at: '2024-01-01T12:00:00Z',
        name: 'Antina Unde',
        tagline: 'A nutritious and traditional sweet delicacy.',
        description: 'A healthy and tasty sweet ball made from edible gum (antu), dry fruits, jaggery, and ghee. A perfect energy booster, traditionally given to new mothers but loved by all.',
        gst_rate: 5,
        image_urls: ['https://static.wixstatic.com/media/88c0f0_56c753b272ec432b8423d2400e234c9c~mv2.png'],
        categories: null,
        category_id: 'snacks-uuid',
        spice_level: 'None',
        is_vegan: false,
        is_sponsored: false,
        is_active: true,
        ingredients: ['Edible Gum', 'Jaggery', 'Ghee', 'Almonds', 'Cashews', 'Copra'],
        how_to_use: 'Consume one unde daily for a boost of energy and nutrition. Perfect as a healthy dessert or a guilt-free snack.',
        benefits: 'Natural energy booster, excellent for postpartum recovery and bone health.',
        nutrition: [
            { key: 'Serving Size', value: '1 piece (25g)' },
            { key: 'Calories', value: '120 kcal' },
        ],
        pairs_well_with: ['kashaya-powder', 'puliyogare-gojju'],
        average_rating: 4.6,
        review_count: 12,
        // FIX: Renamed 'variants' to 'product_variants' to match the Product type.
        product_variants: [
            { id: 'variant-uuid-3a', product_id: 'antina-unde', net_weight: '200g (Approx. 8 pieces)', price: 250, mrp: 265, stock_quantity: 0, created_at: '2024-01-01T12:00:00Z' }
        ],
        // FIX: Add missing properties to conform to Product type
        meta_title: null,
        meta_description: null,
        meta_keywords: null,
    }
];