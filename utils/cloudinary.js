const { v2: cloudinary } = require('cloudinary');

const enabled = !!process.env.CLOUDINARY_URL;

if (enabled) {
  cloudinary.config({ secure: true });
}

function uploadImage(buffer, options = {}) {
  const opts = {
    folder: options.folder,
    resource_type: 'image',
    use_filename: true,
    unique_filename: true,
    overwrite: false
  };
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(opts, (err, res) => {
      if (err) return reject(err);
      resolve({ url: res.secure_url, public_id: res.public_id, format: res.format });
    });
    stream.end(buffer);
  });
}

function uploadRaw(buffer, options = {}) {
  const opts = {
    folder: options.folder,
    resource_type: 'raw',
    use_filename: true,
    unique_filename: true,
    overwrite: false
  };
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(opts, (err, res) => {
      if (err) return reject(err);
      resolve({ url: res.secure_url, public_id: res.public_id, format: res.format });
    });
    stream.end(buffer);
  });
}

function extractPublicIdFromUrl(url) {
  if (!url) return null;
  const m = url.match(/\/(?:image|raw)\/upload\/v\d+\/(.+)\.[^\/]+$/);
  return m ? m[1] : null;
}

function deleteResource(publicId, resourceType = 'image') {
  if (!enabled || !publicId) return Promise.resolve();
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

module.exports = { enabled, uploadImage, uploadRaw, extractPublicIdFromUrl, deleteResource };
function buildImageUrl(publicId) {
  const url = cloudinary.url(publicId, {
    resource_type: 'image',
    secure: true,
    transformation: [{ fetch_format: 'auto', quality: 'auto' }]
  });
  return url;
}
function buildRawUrl(publicId, format = 'pdf', filename) {
  const normalizedId = (publicId && typeof publicId === 'string' && publicId.toLowerCase().endsWith(`.${format}`))
    ? publicId.slice(0, -(`.${format}`).length)
    : publicId;
  const url = cloudinary.url(normalizedId, {
    resource_type: 'raw',
    secure: true,
    format,
    flags: 'inline',
    transformation: [{ flags: 'inline' }],
    ...(filename ? { filename_override: filename } : {})
  });
  return url;
}
module.exports.buildImageUrl = buildImageUrl;
module.exports.buildRawUrl = buildRawUrl;
function buildRawDirectUrl(publicId, format = 'pdf') {
  const normalizedId = (publicId && typeof publicId === 'string' && publicId.toLowerCase().endsWith(`.${format}`))
    ? publicId.slice(0, -(`.${format}`).length)
    : publicId;
  const url = cloudinary.url(normalizedId, {
    resource_type: 'raw',
    secure: true,
    format
  });
  return url;
}
module.exports.buildRawDirectUrl = buildRawDirectUrl;
function buildRawSignedDownloadUrl(publicId, format = 'pdf', filename) {
  const normalizedId = (publicId && typeof publicId === 'string' && publicId.toLowerCase().endsWith(`.${format}`))
    ? publicId.slice(0, -(`.${format}`).length)
    : publicId;
  const url = cloudinary.utils.private_download_url(normalizedId, format, {
    resource_type: 'raw',
    type: 'upload',
    ...(filename ? { attachment: filename } : {})
  });
  return url;
}
module.exports.buildRawSignedDownloadUrl = buildRawSignedDownloadUrl;
