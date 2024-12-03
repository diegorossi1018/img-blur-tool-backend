// server.js

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream'); // Import Readable from stream

const app = express();
const PORT = process.env.PORT || 5000;

// Create upload directories if they don't exist
const originalDir = path.join(__dirname, 'uploads', 'original');
const blurredDir = path.join(__dirname, 'uploads', 'blurred');

fs.mkdirSync(originalDir, { recursive: true });
fs.mkdirSync(blurredDir, { recursive: true });

// Serve static files from the 'public' directory
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '10mb' })); // To handle large image uploads

// Endpoint to fetch and save the original image from URL
app.post('/api/upload-url', async (req, res) => {
    const { imageUrl } = req.body;

    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            return res.status(400).json({ error: 'Failed to fetch image.' });
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
            return res.status(400).json({ error: 'URL does not point to a valid image.' });
        }

        const extension = contentType.split('/')[1];
        const filename = `original_${Date.now()}.${extension}`;
        const filepath = path.join(originalDir, filename);
        const fileStream = fs.createWriteStream(filepath);

        // Convert the WHATWG ReadableStream to Node.js ReadableStream
        const nodeStream = Readable.fromWeb(response.body);

        // Pipe the Node.js stream to the file
        nodeStream.pipe(fileStream);

        // Handle stream events
        fileStream.on('finish', () => {
            res.json({ filename });
        });

        fileStream.on('error', (err) => {
            console.error(err);
            res.status(500).json({ error: 'Failed to save image.' });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// Endpoint to receive blurred image and save it
app.post('/api/upload-blurred', async (req, res) => {
    const { blurredImage } = req.body;

    // Decode base64 image
    const matches = blurredImage.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Invalid image data.' });
    }

    const extension = matches[1].split('/')[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `blurred_${Date.now()}.${extension}`;
    const filepath = path.join(blurredDir, filename);

    try {
        await fs.promises.writeFile(filepath, buffer);
        // Generate a link to access the blurred image
        const imageUrl = `/uploads/blurred/${filename}`;
        res.json({ imageUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save image.' });
    }
});

// Serve blurred images
app.use('/uploads/blurred', express.static(path.join(__dirname, 'uploads', 'blurred')));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
