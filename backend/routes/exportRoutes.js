const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const ExportController = require('../controllers/exportController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `import_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

router.get('/loans/export', ExportController.exportAllLoans);
router.get('/loans/:loanId/export', ExportController.exportSpecificLoan);
router.post('/loans/import', upload.single('file'), ExportController.importBackupData);

module.exports = router;