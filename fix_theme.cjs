const fs = require('fs');
const path = require('path');

function replaceInFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    
    content = content.replace(/text-white/g, 'text-foreground');
    content = content.replace(/border-white\/5/g, 'border-foreground/5');
    content = content.replace(/border-white\/10/g, 'border-foreground/10');
    content = content.replace(/border-white\/20/g, 'border-foreground/20');
    content = content.replace(/border-white\/30/g, 'border-foreground/30');
    
    content = content.replace(/bg-white\/5/g, 'bg-foreground/5');
    content = content.replace(/bg-white\/10/g, 'bg-foreground/10');
    content = content.replace(/bg-white\/20/g, 'bg-foreground/20');
    
    // Convert hardcoded bg-black to something dynamic, maybe bg-foreground/10 or similar?
    // Let's do a few manually where it's used for cards
    content = content.replace(/bg-black\/20/g, 'bg-foreground/[0.05]');
    content = content.replace(/bg-black\/40/g, 'bg-foreground/[0.08]');
    content = content.replace(/bg-black\/60/g, 'bg-foreground/[0.12]');
    
    fs.writeFileSync(filepath, content, 'utf8');
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            replaceInFile(fullPath);
        }
    }
}

walkDir('apps/frontend/src');
