import express from 'express';
import multer from 'multer';
import { extractFieldsController } from './controller.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// API route
app.post('/api/extract-fields', upload.single('file'), extractFieldsController);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});


