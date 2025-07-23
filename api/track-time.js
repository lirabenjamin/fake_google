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

  console.log('Track-time API called with:', req.body);

  try {
    let bodyData;
    
    // Handle different content types (sendBeacon sends as text/plain)
    if (typeof req.body === 'string') {
      try {
        bodyData = JSON.parse(req.body);
      } catch (e) {
        bodyData = req.body;
      }
    } else {
      bodyData = req.body;
    }

    const { 
      prolificId, 
      eventType, 
      totalActiveTime, 
      sessionDuration, 
      timestamp, 
      userAgent, 
      referrer, 
      pageUrl 
    } = bodyData;

    if (!prolificId || !eventType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await client.connect();
    const db = client.db(process.env.MONGODB_DATABASE || 'research_tracking');
    const collection = db.collection(process.env.MONGODB_COLLECTION || 'click_events');

    const timeData = {
      prolificId,
      eventType,
      totalActiveTime: totalActiveTime || 0,
      sessionDuration: sessionDuration || 0,
      timestamp: timestamp || new Date().toISOString(),
      userAgent: userAgent || req.headers['user-agent'],
      referrer: referrer || req.headers.referer,
      pageUrl: pageUrl || req.headers.referer,
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      createdAt: new Date()
    };

    const result = await collection.insertOne(timeData);
    
    res.status(200).json({ 
      success: true, 
      id: result.insertedId,
      message: 'Time data tracked successfully' 
    });

  } catch (error) {
    console.error('Error tracking time:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) {
      await client.close();
    }
  }
};