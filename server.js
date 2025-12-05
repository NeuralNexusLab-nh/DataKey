const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_DIR = path.join(__dirname, 'db');

// 確保資料庫目錄存在
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR);
}

// Middleware
app.use(express.json());

// --- CSS & UI 常數 (紫色駭客風格) ---
const THEME_CSS = `
<style>
    @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
    
    body {
        background-color: #05000a;
        color: #d800ff;
        font-family: 'VT323', monospace;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-height: 100vh;
        overflow-x: hidden;
    }
    
    /* CRT Scanline Effect */
    body::before {
        content: " ";
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
        z-index: 2;
        background-size: 100% 2px, 3px 100%;
        pointer-events: none;
    }

    h1 {
        font-size: 4rem;
        text-shadow: 0 0 10px #d800ff, 0 0 20px #d800ff;
        margin-top: 50px;
        letter-spacing: 5px;
        text-transform: uppercase;
    }

    .container {
        width: 80%;
        max-width: 900px;
        border: 2px solid #5500aa;
        padding: 2rem;
        box-shadow: 0 0 15px #5500aa, inset 0 0 20px #220044;
        background: rgba(10, 0, 20, 0.9);
        position: relative;
        z-index: 10;
        margin-bottom: 50px;
    }

    p, li, h3, h2 {
        color: #e0aaff;
    }

    h2 { border-bottom: 2px solid #5500aa; padding-bottom: 10px; }
    h3 { margin-top: 30px; color: #00ff41; text-shadow: 0 0 5px #00ff41; }

    /* Code Block Styling - Fixed newlines using PRE tag */
    pre {
        background: #000;
        border: 1px dashed #d800ff;
        padding: 15px;
        color: #00d2ff; /* Cyan for code */
        font-family: 'Courier New', Courier, monospace;
        overflow-x: auto;
        margin: 10px 0;
        white-space: pre; /* Keeps formatting */
        box-shadow: inset 0 0 10px #220044;
    }

    .btn {
        background: transparent;
        color: #d800ff;
        border: 2px solid #d800ff;
        padding: 15px 30px;
        font-size: 1.5rem;
        font-family: 'VT323', monospace;
        cursor: pointer;
        text-transform: uppercase;
        transition: 0.2s;
        margin: 10px;
        box-shadow: 0 0 5px #d800ff;
    }

    .btn:hover {
        background: #d800ff;
        color: #000;
        box-shadow: 0 0 20px #d800ff;
    }

    .btn-nav {
        border-color: #00d2ff;
        color: #00d2ff;
        box-shadow: 0 0 5px #00d2ff;
    }
    .btn-nav:hover {
        background: #00d2ff;
        color: #000;
        box-shadow: 0 0 20px #00d2ff;
    }

    .nav-bar {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
    }

    .result-box {
        display: none;
        margin-top: 20px;
        border: 2px solid #00ff41;
        padding: 20px;
        color: #00ff41;
        text-align: center;
        box-shadow: 0 0 10px #00ff41;
    }

    .warning {
        color: #ff0055;
        font-weight: bold;
        text-shadow: 0 0 5px #ff0055;
    }

    input {
        background: transparent;
        border: none;
        border-bottom: 2px solid #d800ff;
        color: #fff;
        font-size: 1.5rem;
        font-family: 'VT323', monospace;
        width: 80%;
        text-align: center;
    }
    input:focus { outline: none; }
    
    .comment { color: #666; font-style: italic; }
    .string { color: #e6db74; }
    .key { color: #f92672; }

</style>
`;

// --- Routes ---

// 1. 首頁 (Home)
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>DataKey // SYSTEM</title>
    ${THEME_CSS}
</head>
<body>
    <h1>DataKey Protocol</h1>
    
    <div class="nav-bar">
        <a href="/"><button class="btn">HOME</button></a>
        <a href="/docs"><button class="btn btn-nav">DOCS / API</button></a>
    </div>

    <div class="container">
        <p>Welcome to the DataKey anonymous storage system.</p>
        <p>Generate a secure, persistent Key-Value database identifiable only by a unique 30-hex string.</p>
        
        <div style="text-align: center; margin-top: 40px;">
            <button class="btn" id="createBtn" onclick="createDB()">[ INITIATE DATABASE CREATION ]</button>
        </div>

        <!-- Result Section (Hidden by default) -->
        <div id="resultArea" class="result-box">
            <p>DATABASE CREATED SUCCESSFULLY</p>
            <p style="font-size: 1.2rem;">YOUR ACCESS URL:</p>
            
            <input type="text" id="dbUrl" readonly value="" onclick="this.select()">
            
            <br><br>
            <button class="btn" style="border-color: #00ff41; color: #00ff41;" onclick="copyUrl()">COPY URL</button>
            
            <br><br>
            <p class="warning">WARNING: DO NOT LOSE THIS URL.</p>
            <p class="warning">IF YOU REFRESH THIS PAGE, THE URL WILL BE LOST FOREVER.</p>
            <p class="warning">DO NOT SHARE THIS URL WITH UNAUTHORIZED PERSONNEL.</p>
        </div>
    </div>

    <script>
        async function createDB() {
            const btn = document.getElementById('createBtn');
            btn.innerText = "GENERATING...";
            btn.disabled = true;

            try {
                const response = await fetch('/api/internal/create', { method: 'POST' });
                const data = await response.json();
                
                const urlInput = document.getElementById('dbUrl');
                urlInput.value = data.url;
                
                document.getElementById('resultArea').style.display = 'block';
                btn.style.display = 'none';
            } catch (e) {
                alert('SYSTEM ERROR: ' + e.message);
                btn.innerText = "RETRY";
                btn.disabled = false;
            }
        }

        function copyUrl() {
            const copyText = document.getElementById("dbUrl");
            copyText.select();
            copyText.setSelectionRange(0, 99999); 
            navigator.clipboard.writeText(copyText.value);
            alert("URL COPIED TO CLIPBOARD");
        }
    </script>
</body>
</html>
    `);
});

// 2. 文件頁 (Docs)
app.get('/docs', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>DataKey // DOCS</title>
    ${THEME_CSS}
</head>
<body>
    <h1>DataKey // MANUAL</h1>

    <div class="nav-bar">
        <a href="/"><button class="btn">HOME</button></a>
        <a href="/docs"><button class="btn btn-nav">DOCS / API</button></a>
    </div>

    <div class="container">
        <h2>INTERFACE SPECIFICATION</h2>
        <p>All interactions are performed via HTTP POST requests.</p>
        <p><strong>ENDPOINT:</strong> <span class="dynamic-domain" style="color: #00ff41;">LOADING...</span>/api</p>

        <hr style="border: 1px solid #5500aa; margin: 20px 0;">

        <h2>IMPLEMENTATION EXAMPLES</h2>
        <p>Replace <code>YOUR_DATAKEY_URL</code> with the url generated on the home page (e.g., <code>datakey://...</code>).</p>

        <h3>1. Python (Requests)</h3>
        <pre><code>import requests

url = "<span class="dynamic-domain">http://localhost:3000</span>/api"
payload = {
    "url": "YOUR_DATAKEY_URL",
    "action": "set",  <span class="comment"># or "read"</span>
    "key": "target_key",
    "value": "secret_data"
}

response = requests.post(url, json=payload)

print(f"Status: {response.status_code}")
print(f"Response: {response.text}")</code></pre>

        <h3>2. Python (Standard Lib - Urllib)</h3>
        <pre><code>import urllib.request
import json

url = "<span class="dynamic-domain">http://localhost:3000</span>/api"
data = {
    "url": "YOUR_DATAKEY_URL",
    "action": "set",
    "key": "target_key",
    "value": "secret_data"
}

req = urllib.request.Request(url)
req.add_header('Content-Type', 'application/json')
jsondata = json.dumps(data).encode('utf-8')

try:
    with urllib.request.urlopen(req, jsondata) as f:
        print(f.read().decode('utf-8'))
except Exception as e:
    print(e)</code></pre>

        <h3>3. JavaScript (Node.js / Browser Fetch)</h3>
        <pre><code>async function interact() {
    const url = "<span class="dynamic-domain">http://localhost:3000</span>/api";
    const payload = {
        url: "YOUR_DATAKEY_URL",
        action: "set",
        key: "target_key",
        value: "secret_data"
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const text = await res.text();
    console.log(text);
}

interact();</code></pre>

        <h3>4. CLI (cURL)</h3>
        <pre><code>curl -X POST <span class="dynamic-domain">http://localhost:3000</span>/api \\
     -H "Content-Type: application/json" \\
     -d '{"url": "YOUR_DATAKEY_URL", "action": "set", "key": "target_key", "value": "secret_data"}'</code></pre>

        <hr style="border: 1px solid #5500aa; margin: 40px 0;">
        
        <h2>PARAMETER REFERENCE</h2>
        <pre><code>POST /api

Headers:
  Content-Type: application/json

Body (JSON):
{
  "url": "datakey://{30-hex-string}.kv.db",
  "action": "read" | "set",
  "key": "string",
  "value": "string" // Required only for 'set'
}</code></pre>

    </div>

    <script>
        // Dynamic Domain Update
        // 這段 JS 會在網頁載入後，自動把所有 class 為 dynamic-domain 的文字換成當前網域
        const domain = window.location.origin;
        const elements = document.getElementsByClassName('dynamic-domain');
        for(let el of elements) {
            el.innerText = domain;
        }
    </script>
</body>
</html>
    `);
});

// --- API Endpoints ---

// 內部 API: 創建資料庫
app.post('/api/internal/create', (req, res) => {
    const id = crypto.randomBytes(30).toString('hex');
    const dbPath = path.join(DB_DIR, `${id}.json`);
    
    fs.writeFileSync(dbPath, JSON.stringify({}, null, 2));

    res.json({
        url: `datakey://${id}.kv.db`
    });
});

// 公開 API: 讀取與寫入
app.post('/api', (req, res) => {
    const { url, action, key, value } = req.body;

    // 驗證
    if (!url || !url.startsWith('datakey://') || !url.endsWith('.kv.db')) {
        return res.status(400).send('ERROR: Invalid URL format');
    }

    if (!action || !key) {
        return res.status(400).send('ERROR: Missing action or key');
    }

    const id = url.replace('datakey://', '').replace('.kv.db', '');
    const hexRegex = /^[0-9a-fA-F]+$/;
    if (!hexRegex.test(id)) {
        return res.status(400).send('ERROR: Invalid Database ID');
    }

    const dbPath = path.join(DB_DIR, `${id}.json`);

    if (!fs.existsSync(dbPath)) {
        return res.status(404).send('ERROR: Database not found');
    }

    let data = {};
    try {
        const fileContent = fs.readFileSync(dbPath, 'utf-8');
        data = JSON.parse(fileContent);
    } catch (err) {
        return res.status(500).send('ERROR: DB Corruption');
    }

    if (action === 'set') {
        if (value === undefined) {
            return res.status(400).send('ERROR: Value is required for set action');
        }
        data[key] = value;
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        return res.status(200).send('SUCCESS');

    } else if (action === 'read') {
        const val = data[key];
        const responseText = val !== undefined ? String(val) : '';
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send(responseText);

    } else {
        return res.status(400).send('ERROR: Unknown action');
    }
});

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`DataKey System Online on port ${PORT}`);
});
