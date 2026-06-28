const mongoose = require('mongoose');

const FileAssetSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  url: { type: String, required: true },
  publicId: { type: String, default: '' },
  fileName: { type: String, required: true },
  fileType: { type: String, default: '' }, // e.g. pdf, image, doc
  fileSize: { type: Number, default: 0 },
  mimeType: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('FileAsset', FileAssetSchema);
