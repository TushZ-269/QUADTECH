const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path'); // <-- Added for serving static files
require('dotenv').config();

const app = express();
const port = 3000;

// --- Middleware ---
app.use(cors()); // Enable CORS for all requests
app.use(express.json()); // Enable parsing JSON bodies
// Serve all files from the 'static' folder
app.use(express.static(path.join(__dirname, 'static')));

// --- Get API keys from .env file ---
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const DATA_GOV_API_KEY = process.env.DATA_GOV_API_KEY;
const METALS_API_KEY = process.env.METALS_API_KEY;
const FINNHUB_URL = 'https://finnhub.io/api/v1';

// --- API Helper Functions ---

// 1. Finnhub: Get Company News
async function fetchCompanyNews(symbol) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const url = `${FINNHUB_URL}/company-news?symbol=${symbol}&from=${yesterday}&to=${today}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch Finnhub news');
    return await response.json();
}

// 2. Finnhub: Get a Real-time Quote (Price)
async function fetchQuote(symbol) {
    const url = `${FINNHUB_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch Finnhub quote');
    return await response.json();
}

// 3. data.gov.in: Get Agricultural Data
async function fetchMandiData(commodity) {
    const resourceID = '9ef84268-d588-465a-a308-a864a43d0070';
    const url = `https://api.data.gov.in/resource/${resourceID}?api-key=${DATA_GOV_API_KEY}&format=json&filters[state]=Maharashtra&filters[commodity]=${commodity}&limit=1`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch Mandi data');
    return await response.json();
}

// --- Main API Endpoint (For Simulator News Feed) ---
app.get('/api/data', async (req, res) => {
    const productName = req.query.product || '';
    
    // Simple mapping to find data
    let fetchType = 'none';
    let query = '';
    const pName = productName.toLowerCase();
    
    if (pName.includes('steel') || pName.includes('tata steel')) {
        fetchType = 'finnhub';
        query = 'TATASTEEL.NS'; // .NS is for National Stock Exchange (India)
    } else if (pName.includes('reliance')) {
        fetchType = 'finnhub';
        query = 'RELIANCE.NS';
    } else if (pName.includes('cotton')) {
        fetchType = 'mandi';
        query = 'Cotton';
    } else if (pName.includes('wheat')) {
        fetchType = 'mandi';
        query = 'Wheat';
    } else if (pName.includes('rice') || pName.includes('paddy')) {
        fetchType = 'mandi';
        query = 'Paddy';
    }

    try {
        let responseData = { type: fetchType, quote: null, news: null, commodity: null };

        if (fetchType === 'finnhub') {
            const [quoteData, newsData] = await Promise.all([
                fetchQuote(query),
                fetchCompanyNews(query)
            ]);
            responseData.quote = quoteData;
            responseData.news = newsData;
            responseData.symbol = query;
        } else if (fetchType === 'mandi') {
            const commodityData = await fetchMandiData(query);
            responseData.commodity = commodityData;
        }

        res.json(responseData); // Send the structured data to the frontend

    } catch (error) {
        console.error('Error fetching data from backend:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// --- API Endpoint (For Metal Prices) ---
app.get('/api/metal-prices', async (req, res) => {
    if (!METALS_API_KEY) {
        return res.status(500).json({ success: false, error: 'Metals API key not configured' });
    }
    const url = `https://api.metals.dev/v1/latest?api_key=${METALS_API_KEY}&currency=INR`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch metal prices from metals.dev');
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Metals API call failed:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- Homepage Route ---
// This ensures that visiting http://localhost:3000 loads your app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

// --- Start the server ---
app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
});