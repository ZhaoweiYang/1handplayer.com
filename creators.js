/* Shared demo data for the Vault platform (feed + creator detail pages). */
(function () {
    const gradients = [
        ['#FF4D8D', '#7C5CFF'], ['#FF8A00', '#FF4D8D'], ['#00C6FB', '#7C5CFF'],
        ['#FF4D8D', '#FFC371'], ['#11998E', '#38EF7D'], ['#7C5CFF', '#00C6FB'],
        ['#F857A6', '#FF5858'], ['#4E54C8', '#8F94FB'], ['#FA709A', '#FEE140'],
        ['#30CFD0', '#330867']
    ];

    const creators = [
        {
            id: 'luna', name: 'Luna', handle: '@luna_official', init: 'L', g: 0,
            bio: 'Fashion & lifestyle creator ✨ New encrypted drops every week.',
            subs: '128k', postCount: 42, likes: '2.4M', price: '$6.99',
            posts: [
                { price: '$5.99', likes: '2.4k', cap: 'This week’s exclusive shoot 📸 Encrypted — unlock to see the full set', time: '2h ago', g: 2 },
                { price: '$4.99', likes: '1.9k', cap: 'Sunset rooftop series 🌇 Encrypted', time: '1d ago', g: 5 },
                { price: '$3.99', likes: '1.1k', cap: 'Casual Sunday 🤍 Unlock to view', time: '3d ago', g: 7 },
                { price: '$6.99', likes: '3.3k', cap: 'Studio set — 18 HD photos 🔒', time: '5d ago', g: 8 },
                { price: '$2.99', likes: '870', cap: 'Quick BTS clip 🎬 Encrypted', time: '1w ago', g: 1 },
                { price: '$4.99', likes: '2.0k', cap: 'Travel diary 🌴 members only', time: '1w ago', g: 9 }
            ]
        },
        {
            id: 'aria', name: 'Aria', handle: '@aria.x', init: 'A', g: 1,
            bio: 'Dancer & model 💃 Behind-the-scenes, encrypted and exclusive.',
            subs: '96k', postCount: 31, likes: '1.8M', price: '$5.99',
            posts: [
                { price: '$3.99', likes: '1.8k', cap: 'Full behind-the-scenes 🎬 Encrypted content', time: '5h ago', g: 3 },
                { price: '$5.99', likes: '2.6k', cap: 'Rehearsal set 🩰 Unlock the full video', time: '2d ago', g: 6 },
                { price: '$2.99', likes: '940', cap: 'Morning routine ☕ Encrypted', time: '4d ago', g: 0 },
                { price: '$4.99', likes: '1.5k', cap: 'Photo set — 12 shots 🔒', time: '6d ago', g: 4 }
            ]
        },
        {
            id: 'mia', name: 'Mia', handle: '@mia_studio', init: 'M', g: 2,
            bio: 'Studio photographer 📷 Premium encrypted galleries.',
            subs: '210k', postCount: 58, likes: '3.1M', price: '$7.99',
            posts: [
                { price: '$6.99', likes: '3.1k', cap: '12 HD photos 🔒 Unlock members only', time: 'Yesterday', g: 4 },
                { price: '$5.99', likes: '2.2k', cap: 'Neon nights collection 🌃 Encrypted', time: '2d ago', g: 9 },
                { price: '$4.99', likes: '1.7k', cap: 'Film grain series 🎞️ Unlock to view', time: '4d ago', g: 1 },
                { price: '$8.99', likes: '4.0k', cap: 'Premium gallery — 30 photos 🔒', time: '1w ago', g: 7 },
                { price: '$3.99', likes: '1.0k', cap: 'Street style 👟 Encrypted', time: '1w ago', g: 5 }
            ]
        },
        {
            id: 'yuki', name: 'Yuki', handle: '@yuki.jp', init: 'Y', g: 3,
            bio: 'Tokyo-based creator 🗼 Encrypted lookbooks & vlogs.',
            subs: '74k', postCount: 27, likes: '1.2M', price: '$4.99',
            posts: [
                { price: '$4.99', likes: '1.4k', cap: 'Spring lookbook 🌸 Encrypted', time: '6h ago', g: 8 },
                { price: '$3.99', likes: '980', cap: 'City vlog 🎬 Unlock the full clip', time: '3d ago', g: 2 },
                { price: '$5.99', likes: '2.1k', cap: 'Late night set 🌙 members only', time: '5d ago', g: 6 }
            ]
        },
        {
            id: 'sofia', name: 'Sofia', handle: '@sofia', init: 'S', g: 4,
            bio: 'Fitness & wellness 🧘 Encrypted workout & lifestyle content.',
            subs: '155k', postCount: 49, likes: '2.7M', price: '$5.99',
            posts: [
                { price: '$2.99', likes: '980', cap: 'DM-only bonus clip 💌 Unlock to view', time: 'Yesterday', g: 6 },
                { price: '$4.99', likes: '1.6k', cap: 'Beach session 🏖️ Encrypted', time: '2d ago', g: 0 },
                { price: '$5.99', likes: '2.3k', cap: 'Full workout series 💪 Unlock all', time: '4d ago', g: 3 },
                { price: '$3.99', likes: '1.2k', cap: 'Wellness routine 🌿 members only', time: '1w ago', g: 9 }
            ]
        },
        {
            id: 'nova', name: 'Nova', handle: '@nova_vip', init: 'N', g: 5,
            bio: 'VIP exclusive creator 💎 Everything here is encrypted.',
            subs: '302k', postCount: 71, likes: '5.0M', price: '$9.99',
            posts: [
                { price: '$9.99', likes: '5.0k', cap: 'VIP exclusive drop 💎 Unlock the full set', time: '1h ago', g: 7 },
                { price: '$6.99', likes: '3.4k', cap: 'Private session 🔒 Encrypted', time: '1d ago', g: 1 },
                { price: '$8.99', likes: '4.2k', cap: 'Members gallery — 24 photos', time: '3d ago', g: 4 },
                { price: '$5.99', likes: '2.5k', cap: 'BTS megapack 🎬 Unlock to view', time: '5d ago', g: 8 }
            ]
        }
    ];

    // Curated home feed: one highlighted post per creator.
    const homeFeed = [
        { id: 'luna', p: 0 }, { id: 'aria', p: 0 }, { id: 'mia', p: 0 },
        { id: 'nova', p: 0 }, { id: 'sofia', p: 0 }
    ];

    function grad(i) {
        const pair = gradients[i % gradients.length];
        return `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`;
    }

    function getCreator(id) {
        return creators.find((c) => c.id === id) || null;
    }

    window.VAULT = { gradients, creators, homeFeed, grad, getCreator };
})();
