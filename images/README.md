# images

Creator photos referenced by `creators.js`.

## Avatar
- `rina.jpg` — Rina's profile photo (`photo` field). Used for her avatar and,
  when no `covers` are set, as the first cover slide.
  Falls back to a gradient circle with the initial if missing.

## Cover / background images (top of the profile)
The top banner is a rotating carousel. To use real background images for a
creator, upload the files here and list them in that creator's `covers` array
in `creators.js`, e.g.:

```js
{ id: 'rina', name: 'Rina', ...,
  covers: ['images/rina-bg1.jpg', 'images/rina-bg2.jpg', 'images/rina-bg3.jpg'] }
```

- Any number of images; they auto-rotate every 3.5s with dots to switch.
- If `covers` is omitted, the cover falls back to the profile photo + gradients.
- Recommended: wide/landscape JPGs, ~1200×600 (they're cropped to a 168px band).
- Filenames are case-sensitive; use lowercase with no spaces.
