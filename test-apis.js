


async function testBinance() {
    console.log('--- Testing Binance ---');
    try {
        const res = await fetch('https://fapi.binance.com/fapi/v1/fundingRate?symbol=AVAXUSDT&limit=1', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        console.log('Status:', res.status);
        if (res.ok) {
            const data = await res.json();
            console.log('Data:', JSON.stringify(data).substring(0, 100) + '...');
        } else {
            console.log('Error Text:', await res.text());
        }
    } catch (e) {
        console.error('Fetch failed:', e.message);
    }
}

async function testBybit() {
    console.log('\n--- Testing Bybit ---');
    try {
        const res = await fetch('https://api.bybit.com/v5/market/tickers?category=linear&symbol=AVAXUSDT', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        console.log('Status:', res.status);
        if (res.ok) {
            const data = await res.json();
            console.log('Data:', JSON.stringify(data).substring(0, 100) + '...');
        } else {
            console.log('Error Text:', await res.text());
        }
    } catch (e) {
        console.error('Fetch failed:', e.message);
    }
}

async function testRSS() {
    console.log('\n--- Testing CoinTelegraph RSS ---');
    try {
        const res = await fetch('https://cointelegraph.com/rss/tag/avalanche', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; AVAXPriceBot/1.0)',
                'Accept': 'application/rss+xml, application/xml, text/xml'
            }
        });
        console.log('Status:', res.status);
        if (res.ok) {
            const text = await res.text();
            console.log('Length:', text.length);
            console.log('Snippet:', text.substring(0, 100));
        }
    } catch (e) {
        console.error('Fetch failed:', e.message);
    }
}

(async () => {
    await testBinance();
    await testBybit();
    await testRSS();
})();
