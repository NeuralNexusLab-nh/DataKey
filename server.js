const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;
const DB_DIR = path.join(__dirname, 'db');

if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR);
}

app.use(express.json());

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
        max-width: 800px;
        border: 2px solid #5500aa;
        padding: 2rem;
        box-shadow: 0 0 15px #5500aa, inset 0 0 20px #220044;
        background: rgba(10, 0, 20, 0.9);
        position: relative;
        z-index: 10;
        margin-bottom: 50px;
    }

    p, li {
        font-size: 1.5rem;
        line-height: 1.6;
        color: #e0aaff;
    }

    .code-block {
        background: #000;
        border: 1px dashed #d800ff;
        padding: 15px;
        color: #00ff41; /* Hacker Green for code */
        font-family: 'Courier New', Courier, monospace;
        overflow-x: auto;
        margin: 10px 0;
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

</style>
`;

// --- Routes ---

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
        <p><strong>ENDPOINT:</strong> <span id="endpoint-url" style="color: #00ff41;">LOADING...</span></p>

        <hr style="border: 1px solid #5500aa; margin: 20px 0;">

        <h3>1. SET DATA (WRITE)</h3>
        <p>Save a value to your database.</p>
        <div class="code-block">
POST /api
Content-Type: application/json

{
  "url": "datakey://{your-30-hex-string}.kv.db",
  "action": "set",
  "key": "target_key",
  "value": "secret_payload_data"
}
        </div>
        <p><strong>Response:</strong> 200 OK</p>
        <div class="code-block" style="color: #fff;">SUCCESS</div>

        <hr style="border: 1px solid #5500aa; margin: 20px 0;">

        <h3>2. READ DATA (RETRIEVE)</h3>
        <p>Retrieve a value from your database.</p>
        <div class="code-block">
POST /api
Content-Type: application/json

{
  "url": "datakey://{your-30-hex-string}.kv.db",
  "action": "read",
  "key": "target_key"
}
        </div>
        <p><strong>Response:</strong> 200 OK (Content-Type: text/plain)</p>
        <div class="code-block" style="color: #fff;">secret_payload_data</div>

        <p class="warning">NOTE: If the key does not exist, an empty string is returned.</p>
    </div>

    <script>
        // Dynamic Domain Update
        const domain = window.location.origin;
        document.getElementById('endpoint-url').innerText = domain + '/api';
    </script>
</body>
</html>
    `);
});

// --- API Endpoints ---

app.post('/api/internal/create', (req, res) => {

    const id = crypto.randomBytes(30).toString('hex');
    const dbPath = path.join(DB_DIR, `${id}.json`);

    fs.writeFileSync(dbPath, JSON.stringify({}, null, 2));

    res.json({
        url: `datakey://${id}.kv.db`
    });
});

app.post('/api', (req, res) => {
    const { url, action, key, value } = req.body;

    if (!url || !url.startsWith('datakey://') || !url.endsWith('.kv.db')) {
        return res.status(400).send('ERROR: Invalid URL format');
    }

    if (!action || !key) {
        return res.status(400).send('ERROR: Missing action or key');
    }

    const id = url.replace('datakey://', '').replace('.kv.db', '');

    const hexRegex = /^[0-9a-fA-F]+$/;
    if (!hexRegex.test(id)) {
        return res.status(400).send('ERROR: Invalid Database ID security check failed');
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
        return res.status(400).send('ERROR: Unknown action. Use "read" or "set".');
    }
});

app.listen(PORT, () => {
    console.log(`DataKey System Online on port ${PORT}`);
});
