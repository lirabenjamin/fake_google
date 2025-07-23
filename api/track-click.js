const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Track-click API called with:', req.body);

  try {
    const { 
      prolificId, 
      eventType, 
      linkClicked, 
      linkText, 
      currentActiveTime, 
      timestamp, 
      userAgent, 
      referrer, 
      pageUrl 
    } = req.body;

    if (!prolificId || !linkClicked) {
      console.log('Missing required fields:', { prolificId, linkClicked });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!uri) {
      console.error('MONGODB_URI environment variable not set');
      return res.status(500).json({ error: 'Database configuration missing' });
    }

    console.log('Connecting to MongoDB...');
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(process.env.MONGODB_DATABASE || 'research_tracking');
    const collection = db.collection(process.env.MONGODB_COLLECTION || 'click_events');

    const clickData = {
      prolificId,
      eventType: eventType || 'click',
      linkClicked,
      linkText: linkText || '',
      currentActiveTime: currentActiveTime || 0,
      timestamp: timestamp || new Date().toISOString(),
      userAgent: userAgent || req.headers['user-agent'],
      referrer: referrer || req.headers.referer,
      pageUrl: pageUrl || req.headers.referer,
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      createdAt: new Date()
    };

    console.log('Inserting click data:', clickData);
    const result = await collection.insertOne(clickData);
    console.log('MongoDB insert result:', result);
    
    res.status(200).json({ 
      success: true, 
      id: result.insertedId,
      message: 'Click tracked successfully' 
    });

  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) {
      await client.close();
    }
  }
};