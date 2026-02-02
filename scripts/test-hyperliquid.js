
async function checkHyperliquid() {
    console.log('--- Testing Hyperliquid ---');
    try {
        const response = await fetch('https://api.hyperliquid.xyz/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "type": "metaAndAssetCtxs" })
        });

        console.log('Status:', response.status);
        if (response.ok) {
            const data = await response.json();
            // Find AVAX
            const universe = data[0].universe;
            const avaxIndex = universe.findIndex(u => u.name === 'AVAX');

            if (avaxIndex !== -1) {
                const assetCtx = data[1][avaxIndex];
                console.log('AVAX Found at index:', avaxIndex);
                console.log('Funding:', assetCtx.funding);
                console.log('Open Interest:', assetCtx.openInterest);
                console.log('Oracle Price:', assetCtx.oraclePx);
            } else {
                console.log('AVAX not found in universe');
            }
        }
    } catch (e) {
        console.error('Hyperliquid Error:', e);
    }
}

checkHyperliquid();
