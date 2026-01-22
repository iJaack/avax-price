
async function debugGoogleNews() {
    console.log('--- Debugging Google News Feed ---');

    const url = 'https://news.google.com/rss/search?q=avalanche+crypto+when:7d&hl=en-US&gl=US&ceid=US:en';

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; AVAXPriceBot/1.0)'
            }
        });

        const text = await response.text();
        // Print the first item fully to see structure
        const itemMatch = text.match(/<item[^>]*>[\s\S]*?<\/item>/i);
        if (itemMatch) {
            console.log(itemMatch[0]);
        } else {
            console.log("No items found");
        }

    } catch (e) {
        console.error(`Error: ${e.message}`);
    }
}

debugGoogleNews();
