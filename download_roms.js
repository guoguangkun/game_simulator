const fs = require('fs');
const path = require('path');

const baseUrl = 'https://www.emu-land.net';
const targetDir = path.join(__dirname, 'roms');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchText(url) {
    // console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
            }
        });
        if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
        return res.text();
    } catch (e) {
        console.error(`Fetch error for ${url}: ${e.message}`);
        return null;
    }
}

async function downloadFile(url, filepath) {
    if (fs.existsSync(filepath)) {
        console.log(`Skipping ${path.basename(filepath)} (already exists)`);
        return;
    }
    
    console.log(`Downloading ${url} to ${filepath}...`);
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
            }
        });

        if (!res.ok) throw new Error(`Failed to download ${url}: ${res.statusText}`);

        const fileStream = fs.createWriteStream(filepath);
        const stream = require('stream');
        const { promisify } = require('util');
        const pipeline = promisify(stream.pipeline);

        await pipeline(res.body, fileStream);
        console.log(`Downloaded ${path.basename(filepath)}`);
        await sleep(1000); // Polite delay
    } catch (e) {
        console.error(`Failed to download ${url}: ${e.message}`);
    }
}

async function processPage(url) {
    console.log(`Processing page: ${url}`);
    const html = await fetchText(url);
    if (!html) return false;

    // Find all mgame onclicks
    const regex = /onclick="mgame\('([^']*)'/g;
    let match;
    let foundGames = false;
    
    while ((match = regex.exec(html)) !== null) {
        foundGames = true;
        let intermediateUrl = match[1].replace(/&amp;/g, '&');
        if (!intermediateUrl.startsWith('http')) {
            intermediateUrl = baseUrl + intermediateUrl;
        }
        
        try {
            const intermediateHtml = await fetchText(intermediateUrl);
            if (!intermediateHtml) continue;
            
            // Find all download links in the intermediate HTML
            const linkRegex = /<a href="([^"]*act=getmfl[^"]*fid=[^"]*)"[^>]*>([^<]*)<\/a>/g;
            let linkMatch;
            
            while ((linkMatch = linkRegex.exec(intermediateHtml)) !== null) {
                let downloadUrl = linkMatch[1].replace(/&amp;/g, '&');
                if (!downloadUrl.startsWith('http')) {
                    downloadUrl = baseUrl + downloadUrl;
                }
                const filename = linkMatch[2].trim();
                const safeFilename = filename.replace(/[/\\?%*:|"<>]/g, '-');
                
                await downloadFile(downloadUrl, path.join(targetDir, safeFilename));
            }
        } catch (err) {
            console.error(`Error processing ${intermediateUrl}:`, err);
        }
        
        await sleep(500);
    }
    return foundGames;
}

async function main() {
    // Letters to process: a-z
    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    
    for (const letter of letters) {
        console.log(`Starting processing for letter: ${letter.toUpperCase()}`);
        let page = 1;
        while (true) {
            // URL pattern: https://www.emu-land.net/en/consoles/dendy/roms/a/1
            // Note: Page 1 is usually just .../roms/a, but .../roms/a/1 might redirect or work. 
            // Let's stick to the .../roms/a/N format and handle page 1 specially if needed, 
            // but checking the site structure, /roms/a is page 1, /roms/a/2 is page 2.
            
            let pageUrl;
            if (page === 1) {
                pageUrl = `${baseUrl}/en/consoles/dendy/roms/${letter}`;
            } else {
                pageUrl = `${baseUrl}/en/consoles/dendy/roms/${letter}/${page}`;
            }

            // Check if page exists by looking for "Next" link or checking if we found games
            // If fetching /roms/a/99 returns the same as /roms/a/1 or a 404, we stop.
            // Emu-land usually redirects to first page or shows empty list if out of bounds.
            // We'll rely on `processPage` returning true if it found games.
            
            const gamesFound = await processPage(pageUrl);
            
            if (!gamesFound) {
                console.log(`No games found on page ${page} for letter ${letter}, moving to next letter.`);
                break;
            }

            // Safety check: check if the page actually contains "Page N" class="active" or similar
            // to avoid infinite loops if the site redirects out-of-bounds pages to page 1.
            // For simplicity, we assume if games are found, it's a valid page, but we must be careful of redirects.
            // A simple heuristic: if we are on page > 1 and the HTML looks exactly like page 1, stop.
            // But we don't store page 1 HTML. 
            // Let's just trust finding games for now, but maybe check URL?
            
            // Important: Emu-land might redirect invalid pages.
            // fetchText follows redirects by default.
            // If we request page 10 and it redirects to page 1, we will re-download page 1 games.
            // Since we check for file existence, this is safe-ish, but inefficient.
            // To fix infinite loop: if page > 1, we should check if we are redirected.
            // But fetchText returns body, not response object. Let's fix fetchText to check url.

            page++;
            await sleep(1000);
        }
    }
}

// Override fetchText to check for redirects on pagination
async function fetchTextWithUrlCheck(url, expectedPage) {
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
            },
            redirect: 'follow'
        });
        
        if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
        
        // If we are on page > 1, check if we got redirected to the base letter page (page 1)
        // Emu-land behavior: requesting .../roms/a/999 redirects to .../roms/a
        if (expectedPage > 1) {
            const finalUrl = res.url;
            // If the URL ends with just the letter (e.g. .../roms/a) or .../roms/a/ (no page number), it's a redirect to page 1
            if (finalUrl.endsWith(`/roms/${url.split('/').slice(-2)[0]}`) || finalUrl.endsWith(`/roms/${url.split('/').slice(-2)[0]}/`)) {
                console.log(`Redirected to main letter page from page ${expectedPage}, assuming end of list.`);
                return null; // Treat as empty/end of list
            }
        }

        return res.text();
    } catch (e) {
        console.error(`Fetch error for ${url}: ${e.message}`);
        return null;
    }
}

// Monkey-patching processPage to use the new fetch
async function processPage(url, pageNum) {
    console.log(`Processing page: ${url}`);
    const html = await fetchTextWithUrlCheck(url, pageNum);
    if (!html) return false;

    // Find all mgame onclicks
    const regex = /onclick="mgame\('([^']*)'/g;
    let match;
    let foundGames = false;
    
    while ((match = regex.exec(html)) !== null) {
        foundGames = true;
        let intermediateUrl = match[1].replace(/&amp;/g, '&');
        if (!intermediateUrl.startsWith('http')) {
            intermediateUrl = baseUrl + intermediateUrl;
        }
        
        try {
            const intermediateHtml = await fetchText(intermediateUrl);
            if (!intermediateHtml) continue;
            
            const linkRegex = /<a href="([^"]*act=getmfl[^"]*fid=[^"]*)"[^>]*>([^<]*)<\/a>/g;
            let linkMatch;
            
            while ((linkMatch = linkRegex.exec(intermediateHtml)) !== null) {
                let downloadUrl = linkMatch[1].replace(/&amp;/g, '&');
                if (!downloadUrl.startsWith('http')) {
                    downloadUrl = baseUrl + downloadUrl;
                }
                const filename = linkMatch[2].trim();
                const safeFilename = filename.replace(/[/\\?%*:|"<>]/g, '-');
                
                await downloadFile(downloadUrl, path.join(targetDir, safeFilename));
            }
        } catch (err) {
            console.error(`Error processing ${intermediateUrl}:`, err);
        }
        
        await sleep(500);
    }
    return foundGames;
}

// Redefine fetchText inside main is messy, better restructure
// Just updated main to pass pageNum
async function main() {
    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    
    for (const letter of letters) {
        console.log(`\n=== Starting processing for letter: ${letter.toUpperCase()} ===`);
        let page = 1;
        while (true) {
            let pageUrl;
            if (page === 1) {
                pageUrl = `${baseUrl}/en/consoles/dendy/roms/${letter}`;
            } else {
                pageUrl = `${baseUrl}/en/consoles/dendy/roms/${letter}/${page}`;
            }
            
            const gamesFound = await processPage(pageUrl, page);
            
            if (!gamesFound) {
                console.log(`No games found (or redirected) on page ${page} for letter ${letter}, moving to next letter.`);
                break;
            }

            page++;
            await sleep(1000);
        }
    }
}

main();
