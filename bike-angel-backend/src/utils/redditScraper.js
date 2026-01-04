/**
 * Reddit Scraper for UCSD Bike Theft Posts
 * Manual helper script to extract theft data from r/UCSD
 * 
 * Usage:
 * 1. Go to reddit.com/r/UCSD and search "bike stolen"
 * 2. Copy post data into the incidents array below
 * 3. Run: node src/utils/redditScraper.js
 * 4. Review flagged items
 * 5. Import to database
 */

import { geocodeUCSDLocation, filterNeedsReview } from '../services/geocodingService.js';

// ========== MANUAL DATA ENTRY ==========
// Copy Reddit posts here in this format:
const REDDIT_POSTS = [
  {
    title: 'Bike stolen at Geisel Library',
    text: 'My bike was stolen yesterday around 3pm at the bike racks outside Geisel. It was a black road bike with a cable lock. Please keep an eye out!',
    date: '2024-11-15',
    url: 'https://reddit.com/r/ucsd/...'
  },
  {
    title: 'Another bike theft at Warren',
    text: 'Came back from class and my bike was gone. This was at Warren College near the apartments. Had a U-lock but they cut through it somehow.',
    date: '2024-10-22',
    url: 'https://reddit.com/r/ucsd/...'
  },
  {
    title: 'Bike stolen near Price Center',
    text: 'Left my bike for 2 hours and it was gone. This happened by Price Center yesterday evening.',
    date: '2024-09-30',
    url: 'https://reddit.com/r/ucsd/...'
  },
  // Add more posts here...
];

/**
 * Extract location from Reddit post
 */
function extractLocation(post) {
  const text = `${post.title} ${post.text}`.toLowerCase();
  
  // Common patterns
  const patterns = [
    /stolen (?:at|from|near|by) ([^.,!]+)/i,
    /(?:at|from|near|by) ([^.,!]+)/i,
    /bike racks? (?:at|near|by) ([^.,!]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

/**
 * Extract bike details from post
 */
function extractBikeDetails(post) {
  const text = `${post.title} ${post.text}`.toLowerCase();
  
  const details = {
    color: null,
    type: null,
    lockType: null
  };
  
  // Color
  const colors = ['black', 'white', 'red', 'blue', 'green', 'silver', 'gray', 'yellow'];
  for (const color of colors) {
    if (text.includes(color)) {
      details.color = color;
      break;
    }
  }
  
  // Bike type
  if (text.includes('road bike')) details.type = 'ROAD';
  else if (text.includes('mountain bike') || text.includes('mtb')) details.type = 'MTB';
  else if (text.includes('e-bike') || text.includes('electric')) details.type = 'E-BIKE';
  else if (text.includes('scooter')) details.type = 'SCOOTER';
  
  // Lock type
  if (text.includes('u-lock') || text.includes('u lock')) details.lockType = 'U-LOCK';
  else if (text.includes('cable')) details.lockType = 'CABLE';
  else if (text.includes('chain')) details.lockType = 'CHAIN';
  
  return details;
}

/**
 * Process all Reddit posts
 */
function processRedditPosts() {
  console.log('🔍 Processing Reddit Posts...\n');
  
  const processed = REDDIT_POSTS.map((post, index) => {
    const locationText = extractLocation(post);
    const geocoded = locationText ? geocodeUCSDLocation(locationText) : null;
    const bikeDetails = extractBikeDetails(post);
    
    return {
      id: `reddit_${index + 1}`,
      source: 'reddit',
      sourceUrl: post.url,
      occurredAt: post.date,
      locationText,
      ...geocoded,
      bikeDetails,
      description: post.text,
      originalPost: post
    };
  });
  
  // Show results
  console.log(`✅ Processed ${processed.length} posts\n`);
  
  // Show items that need review
  const needsReview = filterNeedsReview(processed);
  
  if (needsReview.length > 0) {
    console.log(`⚠️  ${needsReview.length} items need manual review:\n`);
    needsReview.forEach(item => {
      console.log(`  ${item.id}: "${item.locationText}"`);
      console.log(`    → Geocoded to: ${item.name}`);
      console.log(`    → Confidence: ${item.confidence}\n`);
    });
  }
  
  // Generate SQL insert statements
  console.log('\n📝 SQL Insert Statements:\n');
  console.log('```sql');
  processed.forEach(item => {
    const description = item.description.replace(/'/g, "''"); // Escape quotes
    console.log(`
INSERT INTO theft_incidents (
  location, 
  location_name, 
  occurred_at, 
  description, 
  source,
  created_at
) VALUES (
  ST_SetSRID(ST_MakePoint(${item.lng}, ${item.lat}), 4326),
  '${item.name}',
  '${item.occurredAt}',
  '${description}',
  'reddit_scrape',
  NOW()
);`);
  });
  console.log('```\n');
  
  return processed;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processRedditPosts();
}

export { processRedditPosts, extractLocation, extractBikeDetails };
