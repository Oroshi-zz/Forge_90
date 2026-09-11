const fs=require('fs');
const css=fs.readFileSync('src/styles.css','utf8');
const VERSION='v'+(fs.existsSync('VERSION')?fs.readFileSync('VERSION','utf8').trim().replace(/^v/i,''):'1.0');
const js=`const APP_VERSION = ${JSON.stringify(VERSION)};\n`+['exercises','nutrition','foods-db','engine','ui-core','views-a','views-b','views-c','views-d','views-e','views-f','main'].map(f=>`/* ==== ${f}.js ==== */\n`+fs.readFileSync('src/'+f+'.js','utf8')).join('\n');
const html=`<!DOCTYPE html>
<html lang="en" data-theme="dark" style="--dim:.7">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FORGE 90</title>
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent('<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fvt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#27321c"/><stop offset="1" stop-color="#0b0f09"/></linearGradient><linearGradient id="fvf" x1=".5" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#f2ff9e"/><stop offset=".45" stop-color="#b5f23d"/><stop offset="1" stop-color="#4d8a0a"/></linearGradient></defs><rect width="48" height="48" rx="13" fill="url(#fvt)"/><rect x=".6" y=".6" width="46.8" height="46.8" rx="12.4" fill="none" stroke="#b5f23d" stroke-opacity=".28" stroke-width="1.2"/><path d="M24 12.4V6.800000000000001M18.8 13 15.9 8.8M29.2 13 32.1 8.8" stroke="#d9f99d" stroke-width="2.2" stroke-linecap="round"/><path transform="translate(24 23.8) scale(0.84) translate(-24 -24)" d="M6.5 19.5H38.8Q42.4 19.5 42.4 23.2V24.4H35.6L31.8 29.2V32.6H36.2V37.6H13.8V32.6H18.2V29.2L15.2 25.6Q9.2 25.1 6.5 19.5Z" fill="url(#fvf)"/><g fill="#f7fbe9" stroke="#0f1a02" stroke-width="1.3" paint-order="stroke"><rect x="5.8" y="28.4" width="4.2" height="12" rx="1.8900000000000001"/><rect x="10.4" y="30.68" width="3.2760000000000002" height="7.4399999999999995" rx="1.4742000000000002"/><rect x="38" y="28.4" width="4.2" height="12" rx="1.8900000000000001"/><rect x="34.324" y="30.68" width="3.2760000000000002" height="7.4399999999999995" rx="1.4742000000000002"/><rect x="13.676" y="33.1" width="20.648000000000003" height="2.6" rx="1.3"/></g></svg>')}">
<link rel="apple-touch-icon" href="icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
<style>
${css}
@media print { .side, .page-head .row, .btn { display:none !important; } .app { display:block; } body { background:#fff; } }
</style>
</head>
<body>
<noscript>FORGE 90 needs JavaScript enabled.</noscript>
<script>
"use strict";
${js}
</script>
</body>
</html>`;
fs.mkdirSync('dist',{recursive:true}); fs.writeFileSync('dist/FORGE90.html',html); fs.mkdirSync('server/public',{recursive:true}); fs.writeFileSync('server/public/index.html',html);
console.log('built',VERSION,(html.length/1024).toFixed(1)+'KB');
