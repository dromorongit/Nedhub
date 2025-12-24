const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Nedhub build process...');

try {
    // Create dist directory if it doesn't exist
    if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist');
        console.log('📁 Created dist directory');
    }

    // Copy HTML files
    const htmlFiles = ['index.html', 'about.html', 'services.html', 'contact.html'];
    htmlFiles.forEach(file => {
        if (fs.existsSync(file)) {
            fs.copyFileSync(file, path.join('dist', file));
            console.log(`📄 Copied ${file}`);
        }
    });

    // Copy CSS files
    if (!fs.existsSync('dist/css')) {
        fs.mkdirSync('dist/css');
    }
    const cssFiles = ['css/styles.css', 'css/animations.css', 'css/responsive.css'];
    cssFiles.forEach(file => {
        if (fs.existsSync(file)) {
            fs.copyFileSync(file, path.join('dist', file));
            console.log(`🎨 Copied ${file}`);
        }
    });

    // Copy JS files (for now, we'll copy TypeScript files as is for demo)
    if (!fs.existsSync('dist/js')) {
        fs.mkdirSync('dist/js');
    }
    const jsFiles = ['js/main.ts', 'js/nav.ts', 'js/animations.ts', 'js/form-validation.ts'];
    jsFiles.forEach(file => {
        if (fs.existsSync(file)) {
            // For demo purposes, copy as .js files
            const destFile = file.replace('.ts', '.js');
            fs.copyFileSync(file, path.join('dist', destFile));
            console.log(`📜 Copied ${file} as ${destFile}`);
        }
    });

    // Copy other assets if they exist
    if (fs.existsSync('images')) {
        execSync('cp -r images dist/images');
        console.log('🖼️  Copied images directory');
    }

    console.log('✅ Build completed successfully!');
    console.log('📁 Output directory: dist/');
    console.log('🌐 You can now open index.html in your browser');

} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}