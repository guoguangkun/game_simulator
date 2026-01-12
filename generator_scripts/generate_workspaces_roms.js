const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_ROMS_DIR = 'roms';
const TEMPLATE_DIR = 'workspace';
const OUTPUT_BASE_DIR = '.';

// Determine starting index based on existing workspace folders
const existingWorkspaces = fs.readdirSync(OUTPUT_BASE_DIR)
    .filter(file => file.startsWith('workspace') && !isNaN(parseInt(file.replace('workspace', ''))))
    .map(file => parseInt(file.replace('workspace', '')))
    .sort((a, b) => a - b);

let startIndex = 1;
if (existingWorkspaces.length > 0) {
    startIndex = existingWorkspaces[existingWorkspaces.length - 1] + 1;
}

console.log(`Starting generation from workspace${startIndex}...`);

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

// Get all .nes files from roms
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
        
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Process each game
nesFiles.forEach((romFile, index) => {
    const workspaceIndex = startIndex + index;
    const newWorkspaceName = `workspace${workspaceIndex}`;
    const newWorkspacePath = path.join(OUTPUT_BASE_DIR, newWorkspaceName);
    
    console.log(`Creating ${newWorkspaceName} for ${romFile}...`);
    
    if (fs.existsSync(newWorkspacePath)) {
        console.log(`  Directory ${newWorkspaceName} already exists, skipping creation.`);
    }
    copyDir(TEMPLATE_DIR, newWorkspacePath);
    
    let targetRomsDir = path.join(newWorkspacePath, 'dist', 'roms');
    let jsAppPath = path.join(newWorkspacePath, 'dist', 'js', 'app.js');
    
    if (!fs.existsSync(path.join(newWorkspacePath, 'dist'))) {
        targetRomsDir = path.join(newWorkspacePath, 'roms');
        jsAppPath = path.join(newWorkspacePath, 'js', 'app.js');
    }
    
    if (!fs.existsSync(targetRomsDir)) {
        fs.mkdirSync(targetRomsDir, { recursive: true });
    }
    
    const srcRomPath = path.join(SOURCE_ROMS_DIR, romFile);
    const destRomPath = path.join(targetRomsDir, romFile);
    fs.copyFileSync(srcRomPath, destRomPath);
    
    if (fs.existsSync(jsAppPath)) {
        let appContent = fs.readFileSync(jsAppPath, 'utf8');
        const newFetchLine = `fetch('roms/${romFile.replace(/'/g, "\\'")}')`;
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
