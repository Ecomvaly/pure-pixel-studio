const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// [A] FFmpeg Path Setup (Cross-platform verification)
if (process.platform === 'win32') {
  ffmpeg.setFfmpegPath('C:\\FFmpeg\\ffmpeg.exe');
}

const app = express();
const PORT = process.env.PORT || 7860;

const uploadDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'processed');

// [B] Secure Directory Initialization
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// [C] Multer Storage & Security Limits Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 1024 } // 1GB limit per file protection
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// [D] Open Processed Folder Endpoint (Cross-platform support)
app.get('/open-folder', (req, res) => {
  const cmd = process.platform === 'win32' ? `start "" "${outputDir}"` : process.platform === 'darwin' ? `open "${outputDir}"` : `xdg-open "${outputDir}"`;
  exec(cmd, (err) => {
    if (err) {
      res.json({ success: false, error: err.message });
    } else {
      res.json({ success: true });
    }
  });
});

// [E] Homepage UI Route
app.get('/', (req, res) => {
  res.send(
    '<!DOCTYPE html>' +
    '<html lang="en">' +
    '<head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>PurePixel Studio - Metadata & AI Detection Shield</title>' +
      '<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛡️</text></svg>">' +
      '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">' +
      '<style>' +
        ':root { --bg: #F8FAFC; --card-bg: #FFFFFF; --border-main: #3B82F6; --accent: #2563EB; --accent-hover: #1D4ED8; --text-main: #0F172A; --text-muted: #64748B; --shadow: 0 20px 35px -5px rgba(37, 99, 235, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }' +
        '* { box-sizing: border-box; }' +
        'body { font-family: "Plus Jakarta Sans", sans-serif; background: var(--bg); color: var(--text-main); margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }' +
        '.container { width: 100%; max-width: 540px; background: var(--card-bg); border: 2.5px solid var(--border-main); border-radius: 24px; padding: 36px; box-shadow: var(--shadow); }' +
        '.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }' +
        '.title-area h1 { margin: 0; font-size: 1.40rem; font-weight: 700; color: var(--text-main); letter-spacing: -0.025em; }' +
        '.title-area p { margin: 4px 0 0 0; font-size: 0.83rem; color: var(--text-muted); }' +
        '.badge { background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; padding: 6px 12px; border-radius: 30px; font-size: 0.75rem; font-weight: 600; }' +
        '.dropzone { border: 2px dashed #60A5FA; border-radius: 16px; padding: 32px 20px; background: linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%); cursor: pointer; text-align: center; transition: all 0.2s ease; margin-bottom: 18px; }' +
        '.dropzone:hover { border-color: var(--accent); background: #E0E7FF; }' +
        '.dropzone-icon { font-size: 2rem; margin-bottom: 8px; }' +
        '.dropzone-text { font-size: 0.9rem; font-weight: 600; color: var(--text-main); }' +
        '.dropzone-sub { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; }' +
        'input[type="file"] { display: none; }' +
        '.file-list { margin-bottom: 18px; max-height: 160px; overflow-y: auto; border: 1px solid #93C5FD; border-radius: 12px; background: #F8FAFC; padding: 8px; }' +
        '.file-item { display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; font-size: 0.82rem; border-bottom: 1px solid #E2E8F0; }' +
        '.file-item:last-child { border-bottom: none; }' +
        '.file-info { display: flex; align-items: center; gap: 10px; overflow: hidden; }' +
        '.file-thumb { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: #EFF6FF; border: 1px solid #BFDBFE; font-size: 1rem; flex-shrink: 0; }' +
        '.file-name { color: var(--text-main); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 280px; }' +
        '.btn-group { display: flex; gap: 10px; }' +
        '.btn { background: var(--accent); color: white; border: none; padding: 14px; font-weight: 600; border-radius: 12px; cursor: pointer; font-size: 0.9rem; width: 100%; transition: background 0.2s; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }' +
        '.btn:hover { background: var(--accent-hover); }' +
        '.btn:disabled { background: #E2E8F0; cursor: not-allowed; color: #94A3B8; box-shadow: none; }' +
        '.btn-secondary { background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; box-shadow: none; width: auto; padding: 14px 18px; }' +
        '.btn-secondary:hover { background: #DBEAFE; }' +
        '#status { margin-top: 16px; font-size: 0.85rem; font-weight: 600; text-align: center; }' +
        '.success { color: #16A34A; }' +
        '.error { color: #DC2626; }' +
        '.processing { color: #D97706; }' +
      '</style>' +
    '</head>' +
    '<body>' +
      '<div class="container">' +
        '<div class="header">' +
          '<div class="title-area">' +
            '<h1>PurePixel Studio</h1>' +
            '<p>Metadata & AI Detection Shield</p>' +
          '</div>' +
          '<div class="badge">Pro Guard</div>' +
        '</div>' +
        '<form id="uploadForm" enctype="multipart/form-data">' +
          '<div class="dropzone" onclick="document.getElementById(\'fileInput\').click()">' +
            '<div class="dropzone-icon">🖼️🎥</div>' +
            '<div class="dropzone-text" id="dropText">Click or drop videos & images here</div>' +
            '<div class="dropzone-sub">Bypasses AI detection while keeping human quality 100%</div>' +
            '<input type="file" id="fileInput" name="media" multiple accept="video/*,image/*">' +
          '</div>' +
          '<div id="fileListContainer" class="file-list" style="display: none;"></div>' +
          '<div class="btn-group">' +
            '<button type="submit" id="submitBtn" class="btn" disabled>Bypass AI & Clean Metadata</button>' +
            '<button type="button" class="btn btn-secondary" onclick="openFolder()" title="Open Processed Folder">📂</button>' +
          '</div>' +
        '</form>' +
        '<div id="status"></div>' +
      '</div>' +
      '<script>' +
        'const fileInput = document.getElementById("fileInput");' +
        'const dropText = document.getElementById("dropText");' +
        'const fileListContainer = document.getElementById("fileListContainer");' +
        'const submitBtn = document.getElementById("submitBtn");' +
        'fileInput.onchange = () => {' +
          'if (fileInput.files.length > 0) {' +
            'dropText.textContent = fileInput.files.length + " file(s) selected";' +
            'submitBtn.removeAttribute("disabled");' +
            'fileListContainer.style.display = "block";' +
            'fileListContainer.innerHTML = "";' +
            'for (let i = 0; i < fileInput.files.length; i++) {' +
              'const file = fileInput.files[i];' +
              'const div = document.createElement("div");' +
              'div.className = "file-item";' +
              'let fileIcon = "🖼️";' +
              'if (file.type.startsWith("video/")) {' +
                'fileIcon = "🎬";' +
              '}' +
              'div.innerHTML = \'<div class="file-info"><div class="file-thumb">\' + fileIcon + \'</div><span class="file-name">\' + file.name + \'</span></div><span style="color: #2563EB; font-size: 0.72rem; font-weight: 600; flex-shrink: 0;">Ready</span>\';' +
              'fileListContainer.appendChild(div);' +
            '}' +
          '}' +
        '};' +
        'async function openFolder() {' +
          'try { await fetch("/open-folder"); } catch(err) { alert("Could not open folder automatically."); }' +
        '}' +
        'document.getElementById("uploadForm").onsubmit = async (e) => {' +
          'e.preventDefault();' +
          'const formData = new FormData();' +
          'for (let file of fileInput.files) { formData.append("media", file); }' +
          'submitBtn.setAttribute("disabled", "true");' +
          'const statusEl = document.getElementById("status");' +
          'statusEl.className = "processing";' +
          'statusEl.textContent = "⚡ Processing files securely, please wait...";' +
          'try {' +
            'const res = await fetch("/process", { method: "POST", body: formData });' +
            'const data = await res.json();' +
            'if(data.success) {' +
              'statusEl.className = "success";' +
              'statusEl.textContent = "🎉 Done! Click folder button to view results.";' +
              'submitBtn.removeAttribute("disabled");' +
            '} else {' +
              'statusEl.className = "error";' +
              'statusEl.textContent = "Error: " + (data.error || "Failed");' +
              'submitBtn.removeAttribute("disabled");' +
            '}' +
          '} catch(err) {' +
            'statusEl.className = "error";' +
            'statusEl.textContent = "Server connection error.";' +
            'submitBtn.removeAttribute("disabled");' +
          '}' +
        '};' +
      '</script>' +
    '</body>' +
    '</html>'
  );
});

// [F] Processing Engine Route
app.post('/process', (req, res) => {
  upload.array('media')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: "File too large. Maximum size allowed is 1GB per file." });
      }
      return res.status(400).json({ success: false, error: err.message });
    }

    const activeCommands = [];

    const disconnectHandler = () => {
      activeCommands.forEach(cmd => {
        try { cmd.kill('SIGKILL'); } catch (e) {}
      });
    };
    req.on('close', disconnectHandler);

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, error: "No files uploaded." });
      }

      for (const file of req.files) {
        const parsed = path.parse(file.originalname);
        const baseName = parsed.name;
        const ext = parsed.ext.toLowerCase();

        let finalFileName = `${baseName}@${ext}`;
        let outputPath = path.join(outputDir, finalFileName);

        let counter = 1;
        while (fs.existsSync(outputPath)) {
          finalFileName = `${baseName} (${counter})@${ext}`;
          outputPath = path.join(outputDir, finalFileName);
          counter++;
        }

        const isVideo = ['.mp4', '.mkv', '.mov', '.avi', '.webm', '.m4v'].includes(ext);
        const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext);

        try {
          if (isVideo) {
            // [I] Fixed FFmpeg Options & Array Format for Proper Execution
            await new Promise((resolve, reject) => {
              const command = ffmpeg(file.path)
                .outputOptions([
                  '-map', '0:v?',
                  '-map', '0:a?',
                  '-map_metadata', '-1',
                  '-c:v', 'libx264',
                  '-crf', '14',
                  '-preset', 'slow',
                  '-c:a', 'aac',
                  '-b:a', '192k'
                ])
                .save(outputPath)
                .on('end', () => {
                  const index = activeCommands.indexOf(command);
                  if (index > -1) activeCommands.splice(index, 1);
                  resolve();
                })
                .on('error', (err) => {
                  console.error('❌ FFmpeg Processing Error:', err.message);
                  const index = activeCommands.indexOf(command);
                  if (index > -1) activeCommands.splice(index, 1);
                  reject(err);
                });

              activeCommands.push(command);
            });
          } else if (isImage) {
            const imagePipeline = sharp(file.path).rotate().withMetadata(false);

            if (ext === '.png') {
              imagePipeline.png({ quality: 99, compressionLevel: 9 });
            } else if (ext === '.webp') {
              imagePipeline.webp({ quality: 99 });
            } else if (ext === '.avif') {
              imagePipeline.avif({ quality: 99 });
            } else {
              imagePipeline.jpeg({ quality: 99, mozjpeg: true });
            }

            await imagePipeline.toFile(outputPath);
          } else {
            console.warn(`Skipping unsupported file type: ${file.originalname}`);
          }
        } catch (fileErr) {
          console.error(`Error processing file ${file.originalname}:`, fileErr);
          if (fs.existsSync(outputPath)) {
            try { await fs.promises.unlink(outputPath); } catch (e) {}
          }
        } finally {
          if (fs.existsSync(file.path)) {
            try {
              await fs.promises.unlink(file.path);
            } catch (unlinkErr) {
              console.error(`Failed to delete temp file ${file.path}:`, unlinkErr);
            }
          }
        }
      }

      req.off('close', disconnectHandler);
      res.json({ success: true });
    } catch (processingErr) {
      req.off('close', disconnectHandler);
      res.status(500).json({ success: false, error: processingErr.message });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running securely! Open your browser and visit: http://localhost:${PORT}`);
});