const fs = require('fs');
const path = require('path');

const rootDir = '.';

// Find all directories starting with 'workspace' followed by a number
const workspaceDirs = fs.readdirSync(rootDir).filter(file => {
    return fs.statSync(file).isDirectory() && 
           file.startsWith('workspace') && 
           !isNaN(parseInt(file.replace('workspace', '')));
});

console.log(`Found ${workspaceDirs.length} workspace directories to restructure.`);

workspaceDirs.forEach(dir => {
    const fullPath = path.join(rootDir, dir);
    const innerWorkspacePath = path.join(fullPath, 'workspace');

    // Check if the inner 'workspace' folder already exists to avoid double-nesting
    if (fs.existsSync(innerWorkspacePath)) {
        console.log(`Skipping ${dir}: 'workspace' subdirectory already exists.`);
        return;
    }

    console.log(`Processing ${dir}...`);

    // Create the 'workspace' subdirectory
    fs.mkdirSync(innerWorkspacePath);

    // Read all items in the current workspace directory
    const items = fs.readdirSync(fullPath);

    items.forEach(item => {
        // Skip the newly created 'workspace' directory itself
        if (item === 'workspace') return;

        const srcPath = path.join(fullPath, item);
        const destPath = path.join(innerWorkspacePath, item);

        // Move the item to the inner 'workspace' directory
        try {
            fs.renameSync(srcPath, destPath);
        } catch (err) {
            console.error(`Error moving ${item} in ${dir}:`, err);
        }
    });
});

console.log('Restructuring complete.');
