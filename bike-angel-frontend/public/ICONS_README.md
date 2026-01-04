# PWA Icons

This directory needs the following icon files for the PWA to work properly:

## Required Icons

1. **icon-192.png** (192x192 pixels)
   - Used for Android home screen
   - Used for notifications
   - Should be a square icon with the Bike Angel logo

2. **icon-512.png** (512x512 pixels)
   - Used for Android splash screen
   - Used for high-resolution displays
   - Should be a square icon with the Bike Angel logo

3. **apple-touch-icon.png** (180x180 pixels)
   - Used for iOS home screen
   - Should be a square icon with the Bike Angel logo

## Icon Design Guidelines

- Use a simple, recognizable design
- Ensure good contrast for visibility
- Use the app's primary color (#2563eb - blue)
- Include a bicycle or angel wing motif
- Make sure the icon works well at small sizes

## Temporary Solution

Until proper icons are created, you can:
1. Use a placeholder icon generator like https://realfavicongenerator.net/
2. Or create simple colored squares with the app initials "BA"
3. Or use a bicycle emoji as a temporary icon

## Icon Generation Tools

- **Figma**: Design custom icons
- **Canva**: Quick icon creation
- **RealFaviconGenerator**: Generate all required sizes
- **PWA Asset Generator**: Automated icon generation

## Installation

Once you have the icons:
1. Place them in the `/public` directory
2. Ensure they match the names in manifest.json
3. Test the PWA installation on mobile devices
