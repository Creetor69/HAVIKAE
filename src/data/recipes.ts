
import type { Recipe } from '../types';

export const recipesData: Recipe[] = [
    {
        id: 'bisibelebath',
        name: 'Authentic Bisibelebath',
        description: 'A classic Karnataka one-pot meal made with rice, lentils, and vegetables, perfectly spiced with our signature powder.',
        imageUrl: 'https://images.unsplash.com/photo-1668665636181-2a65b3d2242b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1964&q=80',
        products: ['bisibelebath-powder'],
        ingredients: [
            '1 cup Rice',
            '1 cup Toor Dal (Split Pigeon Peas)',
            '2 cups Mixed Vegetables (carrots, beans, peas)',
            '1 large Onion, chopped',
            '1 large Tomato, chopped',
            '4 tbsp Havikar Bisibelebath Powder',
            '2 tbsp Tamarind Extract',
            '1 tbsp Jaggery (optional)',
            'Salt to taste',
            'For tempering: 2 tbsp Ghee, 1 tsp Mustard Seeds, a few Curry Leaves, 8-10 Cashews'
        ],
        instructions: [
            'Wash and cook rice and toor dal together with a pinch of turmeric until they are soft and mushy. Mash them well and set aside.',
            'In a large, heavy-bottomed pan, heat a little oil and sauté the chopped onion until translucent. Add the mixed vegetables and tomato, and cook for 5-7 minutes.',
            'Add the tamarind extract, jaggery (if using), salt, and the Havikar Bisibelebath Powder. Add about 2 cups of water and bring the mixture to a boil. Let it simmer for 10 minutes until the vegetables are cooked and the raw smell of the masala is gone.',
            'Gently mix in the cooked rice and dal mixture. Stir well to combine, ensuring there are no lumps. Add more hot water if needed to reach your desired consistency (it should be like a thick porridge).',
            'Let the Bisibelebath simmer on low heat for another 5-10 minutes, stirring occasionally.',
            'For the tempering, heat ghee in a small pan. Add mustard seeds and let them splutter. Then add curry leaves and cashews, and fry until the cashews turn golden brown.',
            'Pour the hot tempering over the Bisibelebath and mix well. Serve hot with potato chips, boondi, or a dollop of ghee.'
        ]
    },
    {
        id: 'rasam',
        name: 'Heartwarming Rasam',
        description: 'A tangy and aromatic South Indian soup, traditionally served with rice or enjoyed on its own as a comforting drink.',
        imageUrl: 'https://images.unsplash.com/photo-1695423616640-d620584282ac?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1964&q=80',
        products: ['rasam-powder'],
        ingredients: [
            '1 large Tomato, finely chopped',
            'A small lemon-sized ball of Tamarind (soaked in 1 cup warm water)',
            '2-3 cloves of Garlic, crushed',
            '1.5 tbsp Havikar Rasam Powder',
            '1/4 tsp Turmeric Powder',
            'A pinch of Asafoetida (Hing)',
            'Salt to taste',
            '2 tbsp chopped Coriander leaves',
            'For tempering: 1 tbsp Ghee, 1 tsp Mustard Seeds, 1 dried Red Chili, a few Curry Leaves'
        ],
        instructions: [
            'Squeeze the juice from the soaked tamarind and discard the pulp. Keep the tamarind water aside.',
            'In a pot, add the chopped tomato, crushed garlic, turmeric powder, asafoetida, and salt. Add 2 cups of water and bring to a boil. Cook until the tomatoes are soft and mushy.',
            'Add the tamarind water and the Havikar Rasam Powder to the pot. Mix well and let it simmer for about 5-7 minutes on low heat. Do not over-boil after adding the rasam powder.',
            'In a separate small pan, heat ghee for tempering. Add mustard seeds and let them splutter. Add the dried red chili and curry leaves, and sauté for a few seconds.',
            'Pour the tempering over the rasam. Garnish with fresh coriander leaves.',
            'Serve hot as a soup or with steamed rice.'
        ]
    },
    {
        id: 'puliyogare',
        name: 'Tangy Puliyogare',
        description: 'A flavorful and tangy tamarind rice that is a staple in South Indian households, easy to make with our Gojju paste.',
        imageUrl: 'https://images.unsplash.com/photo-1604803318357-58b29c1a5a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80',
        products: ['puliyogare-gojju'],
        ingredients: [
            '2 cups cooked Rice, cooled down',
            '3-4 tbsp Havikar Puliyogare Gojju',
            '2 tbsp Sesame Oil or Ghee',
            '1/4 cup Peanuts or Cashews',
            'A few Curry Leaves',
            '1 dried Red Chili (optional)',
            'Salt to taste (if needed, as the Gojju is already seasoned)'
        ],
        instructions: [
            'Cook the rice and spread it on a plate to cool down completely. This prevents the rice from getting mushy.',
            'In a pan, heat the sesame oil or ghee. Add the peanuts (or cashews) and fry until they are golden brown. Add the curry leaves and dried red chili and sauté for a moment.',
            'Add the Havikar Puliyogare Gojju to the pan and cook on low heat for 2-3 minutes until the oil starts to separate.',
            'Turn off the heat. Add the cooked, cooled rice to the pan with the Gojju mixture.',
            'Mix gently but thoroughly, ensuring every grain of rice is coated with the paste. Avoid breaking the rice grains.',
            'Check for salt and add if necessary. Let it sit for at least 15-20 minutes for the flavors to meld.',
            'Serve the delicious Puliyogare with papad, yogurt, or chips.'
        ]
    },
    {
        id: 'sambar',
        name: 'Classic Sambar',
        description: 'A delicious and hearty lentil-based vegetable stew, essential for a complete South Indian meal with rice, idli or dosa.',
        imageUrl: 'https://plus.unsplash.com/premium_photo-1694539113693-0e8d08b1a532?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1935&q=80',
        products: ['sambar-powder', 'instant-sambar-premix'],
        ingredients: [
            '1 cup Toor Dal (Split Pigeon Peas)',
            '1.5 cups Mixed Vegetables (drumstick, carrots, pumpkin, brinjal)',
            '1 Onion, quartered',
            '1 Tomato, chopped',
            'A small lemon-sized ball of Tamarind (soaked in warm water)',
            '3 tbsp Havikar Sambar Powder',
            '1/2 tsp Turmeric Powder',
            'Salt to taste',
            'For tempering: 2 tbsp Ghee or Oil, 1 tsp Mustard Seeds, a pinch of Asafoetida (Hing), 1 dried Red Chili, a few Curry Leaves'
        ],
        instructions: [
            'Wash and pressure cook the toor dal with turmeric powder and a few drops of oil until it is soft and well-cooked. Mash it lightly and set aside.',
            'In a large pot, add the mixed vegetables, onion, and tomato. Add enough water to cover them, add salt, and cook until the vegetables are tender.',
            'Extract the juice from the soaked tamarind and add it to the pot with the cooked vegetables.',
            'Add the Havikar Sambar Powder and let the mixture boil for about 5 minutes, allowing the flavors to blend.',
            'Now, add the mashed dal to the pot. Mix everything well. Adjust the consistency by adding more water if it is too thick. Let the sambar simmer for 10 minutes on low heat.',
            'For the tempering, heat ghee or oil in a small pan. Add mustard seeds, and once they splutter, add the dried red chili, curry leaves, and asafoetida.',
            'Pour the tempering over the sambar and stir. Garnish with fresh coriander leaves (optional) and serve hot with rice, idli, or dosa.'
        ]
    }
];
