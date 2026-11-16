const express = require('express');
const router = express.Router();

const INDEXNOW_KEY = '4ccbbaa0e01f4733bf703771c2c974a1';
const HOST = 'ani-pulse.netlify.app';

router.post('/indexnow', async (req, res) => {
    const { urlPath } = req.body;

    if (!urlPath) {
        return res.status(400).json({ error: 'urlPath is required' });
    }

    const fullUrl = `https://${HOST}${urlPath}`;

    try {
        const response = await fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
                host: HOST,
                key: INDEXNOW_KEY,
                keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
                urlList: [fullUrl]
            })
        });

        if (response.ok) {
            console.log(`[IndexNow] Successfully pinged for ${fullUrl}`);
            return res.json({ success: true });
        } else {
            const errText = await response.text();
            console.error(`[IndexNow] Failed: ${response.status} ${errText}`);
            return res.status(response.status).json({ error: 'IndexNow rejected the request' });
        }
    } catch (error) {
        console.error('[IndexNow] Network error:', error.message);
        return res.status(500).json({ error: 'Failed to ping IndexNow' });
    }
});

module.exports = router;