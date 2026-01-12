const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_ROMS_DIR = 'roms1';
const TEMPLATE_DIR = 'workspace'; // Use 'workspace' as the template source, assuming it contains the base structure
const OUTPUT_BASE_DIR = '.'; // Create workspace1, workspace2, etc. in the current root

// Ensure source directory exists
if (!fs.existsSync(SOURCE_ROMS_DIR)) {
    console.error(`Source ROMs directory '${SOURCE_ROMS_DIR}' does not exist.`);
    process.exit(1);
}

// Ensure template directory exists
if (!fs.existsSync(TEMPLATE_DIR)) {
    console.error(`Template directory '${TEMPLATE_DIR}' does not exist.`);
    process.exit(1);
}

// Get all .nes files from roms1
const nesFiles = fs.readdirSync(SOURCE_ROMS_DIR).filter(file => file.toLowerCase().endsWith('.nes'));

if (nesFiles.length === 0) {
    console.log('No .nes files found in source directory.');
    process.exit(0);
}

console.log(`Found ${nesFiles.length} NES files to process.`);

// Function to copy directory recursively
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        // Skip 'roms' folder in the copy if we want to keep output clean, 
        // but the user wants to copy the ROM there. We will copy structure first.
        // Actually user says "copy file to workspace/dist/roms under then fetch load it"
        // And "copy entire workspace folder adding 1".
        
        // Let's exclude copying existing roms from the template if we want to save space,
        // or just copy everything as is. Simple copy is safer to preserve structure.
        
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Process each game
nesFiles.forEach((romFile, index) => {
    const workspaceIndex = index + 1;
    const newWorkspaceName = `workspace${workspaceIndex}`;
    const newWorkspacePath = path.join(OUTPUT_BASE_DIR, newWorkspaceName);
    
    console.log(`Creating ${newWorkspaceName} for ${romFile}...`);
    
    // 1. Copy the template workspace to new workspace folder
    if (fs.existsSync(newWorkspacePath)) {
        console.log(`  Directory ${newWorkspaceName} already exists, skipping creation (might overwrite files).`);
        // We continue to overwrite/update logic
    }
    copyDir(TEMPLATE_DIR, newWorkspacePath);
    
    // 2. Define path for the ROM in the new workspace
    // The user mentioned "copy to workspace/dist/roms". 
    // Let's verify if 'dist' exists in the template or if we should use 'roms' directly.
    // Based on previous context, the structure seems to be root -> js, css, roms.
    // But the prompt says "workspace/dist/roms". Let's check if 'dist' exists in 'workspace'.
    // If 'dist' doesn't exist, we might assume standard structure.
    // Wait, the prompt implies "workspace" IS the folder to copy.
    // Let's assume the structure inside 'workspace' has 'dist/roms' OR just 'roms'.
    // I will check for 'dist/roms', if not found, try 'roms'.
    
    let targetRomsDir = path.join(newWorkspacePath, 'dist', 'roms');
    let jsAppPath = path.join(newWorkspacePath, 'dist', 'js', 'app.js');
    
    if (!fs.existsSync(path.join(newWorkspacePath, 'dist'))) {
        // Fallback to root structure if dist doesn't exist
        targetRomsDir = path.join(newWorkspacePath, 'roms');
        jsAppPath = path.join(newWorkspacePath, 'js', 'app.js');
    }
    
    // Ensure target roms directory exists
    if (!fs.existsSync(targetRomsDir)) {
        fs.mkdirSync(targetRomsDir, { recursive: true });
    }
    
    // 3. Copy the specific ROM file
    const srcRomPath = path.join(SOURCE_ROMS_DIR, romFile);
    const destRomPath = path.join(targetRomsDir, romFile);
    fs.copyFileSync(srcRomPath, destRomPath);
    
    // 4. Update app.js to fetch this ROM
    if (fs.existsSync(jsAppPath)) {
        let appContent = fs.readFileSync(jsAppPath, 'utf8');
        
        // Regex to find the fetch call. 
        // We look for fetch('roms/...') or fetch("roms/...")
        // We replace the URL with the new ROM filename.
        // Note: We need to escape special characters in filename for string replacement if needed,
        // but simple string replacement should work if we match the line.
        
        // Pattern: fetch('roms/OldGame.nes') -> fetch('roms/NewGame.nes')
        // We'll replace the first occurrence of fetch('roms/...') which is usually the game loader.
        
        const newFetchLine = `fetch('roms/${romFile.replace(/'/g, "\\'")}')`;
        
        // This regex matches fetch call with single or double quotes
        const fetchRegex = /fetch\(['"]roms\/[^'"]+['"]\)/;
        
        if (fetchRegex.test(appContent)) {
            appContent = appContent.replace(fetchRegex, newFetchLine);
            fs.writeFileSync(jsAppPath, appContent, 'utf8');
            console.log(`  Updated app.js to load ${romFile}`);
        } else {
            console.warn(`  Warning: Could not find fetch('roms/...') pattern in ${jsAppPath}`);
        }
    } else {
        console.error(`  Error: app.js not found at ${jsAppPath}`);
    }
});

console.log('All workspaces generated successfully.');
