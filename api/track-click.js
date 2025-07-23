import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prolificId, linkClicked, timestamp, userAgent, referrer } = req.body;

    if (!prolificId || !linkClicked) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await client.connect();
    const db = client.db('research_tracking');
    const collection = db.collection('click_events');

    const clickData = {
      prolificId,
      linkClicked,
      timestamp: timestamp || new Date().toISOString(),
      userAgent: userAgent || req.headers['user-agent'],
      referrer: referrer || req.headers.referer,
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      createdAt: new Date()
    };

    const result = await collection.insertOne(clickData);
    
    res.status(200).json({ 
      success: true, 
      id: result.insertedId,
      message: 'Click tracked successfully' 
    });

  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await client.close();
  }
}