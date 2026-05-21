import multer from "multer";

// Configure memory storage (ideal for serverless/containers as it avoids local disk clutter)
const storage = multer.memoryStorage();

// File validation filter to ensure only appropriate media/document formats are accepted
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file format. Allowed types: JPEG, PNG, JPG, PDF, DOC, and DOCX."
      ),
      false
    );
  }
};

// Export Multer upload instance configured with 5MB file limit
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});
