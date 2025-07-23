# Vercel Deployment Instructions

## Prerequisites
1. MongoDB Atlas account with a cluster set up
2. Vercel account

## Setup Steps
 
### 1. MongoDB Setup
1. Create a MongoDB Atlas cluster
2. Create a database called `research_tracking`
3. Get your connection string
4. Replace the connection string in `.env.example` and save as `.env.local`

### 2. Vercel Deployment
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Follow the prompts to link your project
4. Set environment variable:
   ```bash
   vercel env add MONGODB_URI
   ```
   Paste your MongoDB connection string when prompted

### 3. Add Tracking to HTML Files
Add this script tag before the closing `</body>` tag in each HTML file:
```html
<script src="/public/track-clicks.js"></script>
```

## Usage
- Users should visit your site with `?PROLIFIC_PID=their_id` in the URL
- All link clicks will be automatically tracked and saved to MongoDB
- Data includes: PROLIFIC_PID, link clicked, timestamp, user agent, and referrer

## Testing
Visit your deployed site with `?PROLIFIC_PID=test123` and click any link to test tracking.