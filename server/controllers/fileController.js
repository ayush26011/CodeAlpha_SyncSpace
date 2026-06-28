const FileAsset = require('../models/FileAsset');
const { cloudinary } = require('../config/cloudinary');
const fs = require('fs');

const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { conversationId } = req.body;
  if (!conversationId) {
    // Clean up local temp file
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'conversationId is required' });
  }

  try {
    // Upload file to Cloudinary. Use 'raw' resource type for PDFs/docs, or let Cloudinary auto-detect.
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'syncspace_shared_assets',
      resource_type: 'auto'
    });

    // Delete temporary local file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const asset = await FileAsset.create({
      owner: req.user._id,
      conversation: conversationId,
      url: result.secure_url,
      publicId: result.public_id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileType: req.file.mimetype.split('/')[0] // 'image', 'video', 'application' etc.
    });

    res.status(201).json(asset);
  } catch (err) {
    console.error("Cloudinary Asset Upload Error:", err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: err.message });
  }
};

module.exports = { uploadFile };
