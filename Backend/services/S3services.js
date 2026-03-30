const AWS = require("aws-sdk");

const uploadToS3 = (data, filename) => {
  // 1. Pull credentials from .env
  const BUCKET_NAME = process.env.S3_BUCKET_NAME;
  const IAM_USER_KEY = process.env.IAM_USER_KEY;
  const IAM_USER_SECRET = process.env.IAM_USER_SECRET;

  // 2. Initialize S3 with Region (Crucial to avoid 500 errors)
  const s3bucket = new AWS.S3({
    accessKeyId: IAM_USER_KEY,
    secretAccessKey: IAM_USER_SECRET,
    // Change 'ap-south-1' to your actual bucket region (e.g., 'us-east-1')
    region: "ap-south-1",
  });

  // 3. Set the upload parameters
  const params = {
    Bucket: BUCKET_NAME,
    Key: filename,
    Body: data,
    // REMOVED: ACL: "public-read"
    // Reason: Modern buckets block this by default.
    // We handle visibility via Bucket Policy instead.
  };

  // 4. Perform the upload
  return new Promise((resolve, reject) => {
    s3bucket.upload(params, (err, s3response) => {
      if (err) {
        console.error("❌ S3 UPLOAD ERROR:", err.message);
        reject(err);
      } else {
        console.log("✅ S3 UPLOAD SUCCESS:", s3response.Location);
        resolve(s3response.Location);
      }
    });
  });
};

module.exports = { uploadToS3 };
