import express from "express";
import cors from "cors";
import multer from "multer";
import sharp from "sharp";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: "uploads/original/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

app.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No File" });

  const quality = parseInt(req.body.quality) || 60;

  const originalPath = req.file.path;
  const compressedFilename = `compressed-${req.file.filename}.jpg`;
  const compressedPath = `uploads/compressed/${compressedFilename}`;

  try {
    await sharp(originalPath)
      .resize({ width: 900, withoutEnlargement: true })
      .jpeg({ quality })
      .toFile(compressedPath);

    const originalSize = fs.statSync(originalPath).size;
    const compressedSize = fs.statSync(compressedPath).size;

    if (compressedSize >= originalSize) {
      fs.copyFileSync(originalPath, compressedPath);
    }


    res.json({
      success: true,
      originalSize,
      compressedSize,
      quality,
      downloadURL: `http://localhost:5000/download/${compressedFilename}`,
      originalFile: req.file.filename
    });

  } catch (err) {
    res.status(500).json({ error: "Compression Failed", err });
  }
});

app.get("/download/:file", (req, res) => {
  const compressedFile = req.params.file;
  const compressedPath = `uploads/compressed/${compressedFile}`;
  
  const originalFile = compressedFile.replace("compressed-", "").replace(".jpg", "");
  const originalPath = `uploads/original/${originalFile}`;

  res.download(compressedPath, (err) => {
    if (err) {
    } else {

      if (fs.existsSync(originalPath)) {
        fs.unlinkSync(originalPath);
      }

      setTimeout(() => {
        if (fs.existsSync(compressedPath)) {
          fs.unlinkSync(compressedPath);
        }
      }, 500);
    }
  });
});

app.listen(5000);
