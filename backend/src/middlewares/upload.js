import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../utils/AppError.js';
import { FILE_UPLOAD } from '../config/constants.js';

// Store files on disk in the uploads folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, FILE_UPLOAD.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate a unique name to prevent collisions
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// Only allow image file types
const fileFilter = (req, file, cb) => {
  if (FILE_UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type. Allowed types: ${FILE_UPLOAD.ALLOWED_TYPES.join(', ')}`,
        400
      ),
      false
    );
  }
};

// Create the multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_UPLOAD.MAX_SIZE,
  },
});

export default upload;
