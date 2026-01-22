

async function debugNews() {
    console.log('--- Debugging News Feeds ---');

    const rssFeeds = [
        { url: 'https://cointelegraph.com/rss/tag/avalanche', source: 'CoinTelegraph' },
        { url: 'https://cryptoslate.com/news/avalanche/?feed=rss', source: 'CryptoSlate' },
        { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/?keyword=avalanche', source: 'CoinDesk' },
        { url: 'https://www.theblock.co/rss/tag/avalanche', source: 'The Block' },
        { url: 'https://coinledger.io/feed', source: 'CoinLedger' },
        { url: 'https://messari.io/rss', source: 'Messari' }
    ];

    for (const feed of rssFeeds) {
        console.log(`\nChecking ${feed.source} (${feed.url})...`);
        try {
            const response = await fetch(feed.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; AVAXPriceBot/1.0)'
                }
            });

            if (!response.ok) {
                console.log(`Failed: ${response.status}`);
                continue;
            }

            const text = await response.text();
            // Simple regex to find items
            const items = text.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
            console.log(`Found ${items.length} items`);

            for (let i = 0; i < Math.min(items.length, 3); i++) {
                const item = items[i];
                const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
                const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/i);
                const title = titleMatch ? titleMatch[1] : 'No Title';
                const pubDate = pubDateMatch ? pubDateMatch[1] : 'No Date';

                // Check filtering logic
                const descriptionMatch = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
                const description = descriptionMatch ? descriptionMatch[1] : '';
                const fullText = (title + description).toLowerCase();
                const isRelevant = fullText.includes('avalanche') || fullText.includes('avax');

                console.log(`  Item ${i + 1}:`);
                console.log(`    Title: ${title.trim()}`);
                console.log(`    Date:  ${pubDate}`);
                console.log(`    Relevant (avax/avalanche): ${isRelevant}`);
                if (!isRelevant) {
                    console.log(`    Snippet: ${fullText.substring(0, 100)}...`);
                }
            }

        } catch (e) {
            console.error(`Error: ${e.message}`);
        }
    }
}

debugNews();
