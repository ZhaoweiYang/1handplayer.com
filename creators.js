/* Shared demo data for the Vault platform (feed + creator detail pages).
   NOTE: Vault itself has no payments or subscriptions — all content is
   simply encrypted. The only way to view it is to unlock with the delock app. */
(function () {
    const gradients = [
        ['#FF4D8D', '#7C5CFF'], ['#FF8A00', '#FF4D8D'], ['#00C6FB', '#7C5CFF'],
        ['#FF4D8D', '#FFC371'], ['#11998E', '#38EF7D'], ['#7C5CFF', '#00C6FB'],
        ['#F857A6', '#FF5858'], ['#4E54C8', '#8F94FB'], ['#FA709A', '#FEE140'],
        ['#30CFD0', '#330867']
    ];

    const creators = [
        {
            id: 'rina', name: 'Rina', handle: '@rina', init: 'R', g: 8,
            photo: 'images/rina.jpg',
            covers: ['images/rina-bg1.jpg', 'images/rina-bg2.jpg'],
            bio: 'Tokyo street style 🖤 New restricted drops every week.',
            followers: '88k', postCount: 24, likes: '1.5M',
            posts: [
                { likes: '2.7k', cap: 'Streetwear set 🖤 Encrypted — unlock the full shoot', time: '1h ago', g: 9 },
                { likes: '1.9k', cap: 'Café day ☕ Encrypted', time: '1d ago', g: 2 },
                { likes: '2.2k', cap: 'Night out 🌃 Unlock to view', time: '2d ago', g: 5 },
                { likes: '1.4k', cap: 'Mirror selfies 🪞 Encrypted', time: '4d ago', g: 0 },
                { likes: '3.0k', cap: 'Beach trip 🏖️ Unlock the full set', time: '1w ago', g: 3 }
            ]
        },
        {
            id: 'luna', name: 'Luna', handle: '@luna_official', init: 'L', g: 0,
            bio: 'Fashion & lifestyle creator ✨ New encrypted drops every week.',
            followers: '128k', postCount: 42, likes: '2.4M',
            posts: [
                { likes: '2.4k', cap: 'This week’s exclusive shoot 📸 Encrypted — unlock to see the full set', time: '2h ago', g: 2 },
                { likes: '1.9k', cap: 'Sunset rooftop series 🌇 Encrypted', time: '1d ago', g: 5 },
                { likes: '1.1k', cap: 'Casual Sunday 🤍 Unlock to view', time: '3d ago', g: 7 },
                { likes: '3.3k', cap: 'Studio set — 18 HD photos 🔒', time: '5d ago', g: 8 },
                { likes: '870', cap: 'Quick BTS clip 🎬 Encrypted', time: '1w ago', g: 1 },
                { likes: '2.0k', cap: 'Travel diary 🌴 Encrypted', time: '1w ago', g: 9 }
            ]
        },
        {
            id: 'aria', name: 'Aria', handle: '@aria.x', init: 'A', g: 1,
            bio: 'Dancer & model 💃 Behind-the-scenes, encrypted and exclusive.',
            followers: '96k', postCount: 31, likes: '1.8M',
            posts: [
                { likes: '1.8k', cap: 'Full behind-the-scenes 🎬 Encrypted content', time: '5h ago', g: 3 },
                { likes: '2.6k', cap: 'Rehearsal set 🩰 Unlock the full video', time: '2d ago', g: 6 },
                { likes: '940', cap: 'Morning routine ☕ Encrypted', time: '4d ago', g: 0 },
                { likes: '1.5k', cap: 'Photo set — 12 shots 🔒', time: '6d ago', g: 4 }
            ]
        },
        {
            id: 'mia', name: 'Mia', handle: '@mia_studio', init: 'M', g: 2,
            bio: 'Studio photographer 📷 Encrypted galleries, unlock with delock.',
            followers: '210k', postCount: 58, likes: '3.1M',
            posts: [
                { likes: '3.1k', cap: '12 HD photos 🔒 Encrypted', time: 'Yesterday', g: 4 },
                { likes: '2.2k', cap: 'Neon nights collection 🌃 Encrypted', time: '2d ago', g: 9 },
                { likes: '1.7k', cap: 'Film grain series 🎞️ Unlock to view', time: '4d ago', g: 1 },
                { likes: '4.0k', cap: 'Gallery — 30 photos 🔒 Encrypted', time: '1w ago', g: 7 },
                { likes: '1.0k', cap: 'Street style 👟 Encrypted', time: '1w ago', g: 5 }
            ]
        },
        {
            id: 'yuki', name: 'Yuki', handle: '@yuki.jp', init: 'Y', g: 3,
            bio: 'Tokyo-based creator 🗼 Encrypted lookbooks & vlogs.',
            followers: '74k', postCount: 27, likes: '1.2M',
            posts: [
                { likes: '1.4k', cap: 'Spring lookbook 🌸 Encrypted', time: '6h ago', g: 8 },
                { likes: '980', cap: 'City vlog 🎬 Unlock the full clip', time: '3d ago', g: 2 },
                { likes: '2.1k', cap: 'Late night set 🌙 Encrypted', time: '5d ago', g: 6 }
            ]
        },
        {
            id: 'sofia', name: 'Sofia', handle: '@sofia', init: 'S', g: 4,
            bio: 'Fitness & wellness 🧘 Encrypted workout & lifestyle content.',
            followers: '155k', postCount: 49, likes: '2.7M',
            posts: [
                { likes: '980', cap: 'Bonus clip 💌 Unlock to view', time: 'Yesterday', g: 6 },
                { likes: '1.6k', cap: 'Beach session 🏖️ Encrypted', time: '2d ago', g: 0 },
                { likes: '2.3k', cap: 'Full workout series 💪 Unlock all', time: '4d ago', g: 3 },
                { likes: '1.2k', cap: 'Wellness routine 🌿 Encrypted', time: '1w ago', g: 9 }
            ]
        },
        {
            id: 'nova', name: 'Nova', handle: '@nova_vip', init: 'N', g: 5,
            bio: 'Exclusive creator 💎 Everything here is encrypted.',
            followers: '302k', postCount: 71, likes: '5.0M',
            posts: [
                { likes: '5.0k', cap: 'Exclusive drop 💎 Unlock the full set', time: '1h ago', g: 7 },
                { likes: '3.4k', cap: 'Private session 🔒 Encrypted', time: '1d ago', g: 1 },
                { likes: '4.2k', cap: 'Gallery — 24 photos 🔒 Encrypted', time: '3d ago', g: 4 },
                { likes: '2.5k', cap: 'BTS megapack 🎬 Unlock to view', time: '5d ago', g: 8 }
            ]
        }
    ];

    // Curated home feed: one highlighted post per creator.
    const homeFeed = [
        { id: 'rina', p: 0 }, { id: 'luna', p: 0 }, { id: 'aria', p: 0 },
        { id: 'mia', p: 0 }, { id: 'nova', p: 0 }, { id: 'sofia', p: 0 }
    ];

    // Generic fan reviews (praise) shown as a scrolling wall on profiles.
    const reviews = [
        { name: 'Mike', text: 'Her body is absolutely unreal 🔥' },
        { name: 'James', text: 'Stunning — best on the whole app 😍' },
        { name: 'Leo', text: 'Perfect figure, I literally can’t look away' },
        { name: 'Daniel', text: 'Unbeatable. Worth every single second 💎' },
        { name: 'Chris', text: 'Gorgeous beyond words 🤤' },
        { name: 'Alex', text: '10/10 body, 10/10 everything' },
        { name: 'Ryan', text: 'The most beautiful creator I follow' },
        { name: 'Tom', text: 'Flawless figure 😩🔥' },
        { name: 'Kevin', text: 'Insane curves, an absolute goddess 👑' },
        { name: 'Nate', text: 'No one else even comes close' },
        { name: 'Sam', text: 'So hot it should be illegal 🥵' },
        { name: 'Jay', text: 'Best body I’ve ever seen, hands down' }
    ];

    function grad(i) {
        const pair = gradients[i % gradients.length];
        return `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`;
    }

    function getCreator(id) {
        return creators.find((c) => c.id === id) || null;
    }

    // Avatar contents: a real photo when available, otherwise the initial.
    // If the photo fails to load it falls back to the initial letter.
    function avatarInner(c) {
        return c.photo
            ? `<img class="av" src="${c.photo}" alt="${c.name}" onerror="this.outerHTML='${c.init}'">`
            : c.init;
    }

    window.VAULT = { gradients, creators, homeFeed, reviews, grad, getCreator, avatarInner };
})();
