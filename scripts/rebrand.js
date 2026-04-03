const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    try {
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            if (file === 'node_modules' || file === '.git' || file === '.next') return;
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
                results = results.concat(walk(filePath));
            } else {
                results.push(filePath);
            }
        });
    } catch (e) {
        // ignore errors
    }
    return results;
}

const targetDir = process.cwd();
const files = walk(targetDir);

files.forEach(file => {
   if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json') || file.endsWith('.md') || file.endsWith('.mjs') || file.endsWith('.css')) {
       let content = fs.readFileSync(file, 'utf8');
       let newContent = content
            .replace(/PayMesh/g, 'PayMesh')
            .replace(/PayMesh/g, 'PayMesh')
            .replace(/paymesh/g, 'paymesh')
            .replace(/PAYMESH/g, 'PAYMESH');
       if (content !== newContent) {
           fs.writeFileSync(file, newContent, 'utf8');
           console.log(`Updated ${file.replace(targetDir, '')}`);
       }
   }
});
