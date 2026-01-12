const fs = require('fs');
const path = require('path');

const rootDir = '.';

// Find all directories starting with 'workspace' followed by a number
const workspaceDirs = fs.readdirSync(rootDir).filter(file => {
    return fs.statSync(file).isDirectory() && 
           file.startsWith('workspace') && 
           !isNaN(parseInt(file.replace('workspace', '')));
});

console.log(`Found ${workspaceDirs.length} workspace directories to rename.`);

workspaceDirs.forEach(dir => {
    const fullPath = path.join(rootDir, dir);
    // Path to check for ROM: workspaceX/workspace/dist/roms/ OR workspaceX/workspace/roms/
    // Based on previous structure, it seems to be workspace/dist/roms or workspace/roms
    // Let's check deep inside.
    
    // The previous restructure put everything inside 'workspace' subfolder.
    // So we look in: dir/workspace/dist/roms OR dir/workspace/roms
    
    const innerWorkspacePath = path.join(fullPath, 'workspace');
    if (!fs.existsSync(innerWorkspacePath)) {
        console.warn(`Skipping ${dir}: 'workspace' subdirectory not found (maybe already renamed or empty).`);
        return;
    }

    let romsDir = path.join(innerWorkspacePath, 'dist', 'roms');
    if (!fs.existsSync(romsDir)) {
        romsDir = path.join(innerWorkspacePath, 'roms');
    }

    if (!fs.existsSync(romsDir)) {
        console.warn(`Skipping ${dir}: ROMs directory not found in ${romsDir}`);
        return;
    }

    try {
        const files = fs.readdirSync(romsDir);
        const nesFile = files.find(file => file.toLowerCase().endsWith('.nes'));

        if (nesFile) {
            // Get the base name without extension
            const gameName = path.basename(nesFile, path.extname(nesFile));
            
            // Clean up the name for directory safety
            // Replace non-alphanumeric chars (except spaces, hyphens, underscores) with nothing or safe chars
            // Also trim spaces.
            // Avoid extremely long names.
            
            let safeName = gameName.replace(/[<>:"/\\|?*]/g, '').trim(); 
            // Optional: Limit length if needed, e.g. safeName.substring(0, 50)
            
            // If the name is empty after cleaning, fallback
            if (!safeName) safeName = dir;

            const newPath = path.join(rootDir, safeName);

            // Check if target directory already exists
            if (fs.existsSync(newPath)) {
                console.warn(`Skipping ${dir}: Target directory '${safeName}' already exists.`);
            } else {
                console.log(`Renaming ${dir} -> ${safeName}`);
                fs.renameSync(fullPath, newPath);
            }
        } else {
            console.warn(`Skipping ${dir}: No .nes file found in ${romsDir}`);
        }
    } catch (err) {
        console.error(`Error processing ${dir}:`, err);
    }
});

console.log('Renaming complete.');
