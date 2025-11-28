import React, { useState } from "react";
import axios from "axios";

const KBReducer = () => {
  const [quality, setQuality] = useState(50);
  const [preview, setPreview] = useState("");
  const [originalSize, setOriginalSize] = useState(null);
  const [compressedSize, setCompressedSize] = useState(null);
  const [estimatedSize, setEstimatedSize] = useState(null);
  const [downloadURL, setDownloadURL] = useState("");
  const [isDownloaded, setIsDownloaded] = useState(false);

  const calculateEstimation = (q) => {
    if (!originalSize) return;
    const estimated = originalSize * (q * 0.015);
    setEstimatedSize(estimated.toFixed(2));
  };

  const handleSlider = (e) => {
    const q = Number(e.target.value);
    setQuality(q);
    calculateEstimation(q);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setIsDownloaded(false);
    setCompressedSize(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("quality", quality);

    const res = await axios.post("http://localhost:5000/upload", formData);

    const originalKB = (res.data.originalSize / 1024).toFixed(2);
    const compKB = (res.data.compressedSize / 1024).toFixed(2);

    setOriginalSize(Number(originalKB));
    setCompressedSize(Number(compKB));
    setEstimatedSize(null);
    setDownloadURL(res.data.downloadURL);

    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 10000);
  };

const handleDownload = async () => {
  if (!downloadURL) return;
  setIsDownloaded(true);

  try {
    // 1️⃣ Fetch file first (mobile support)
    const response = await fetch(downloadURL);
    const blob = await response.blob();

    // 2️⃣ Create download trigger
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "compressed-image.jpg";
    document.body.appendChild(link);
    link.click();
    link.remove();

    // 3️⃣ Clear blob from memory
    setTimeout(() => {
      window.URL.revokeObjectURL(link.href);
    }, 2000);

  } catch (err) {
    console.log("⚠️ Blob download failed, using fallback", err);

    // 4️⃣ Fallback for older mobile browsers
    setTimeout(() => {
      window.location.href = downloadURL;
    }, 600);
  }
};

  const reducedPercent =
    originalSize &&
    (((originalSize - (compressedSize || estimatedSize)) / originalSize) * 100).toFixed(1);

  return (
   <div className="min-h-screen flex justify-center items-start p-4 bg-gray-100 overflow-y-auto">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-xl w-full">

        <h1 className="text-2xl font-bold text-center text-blue-600 mb-4">
          SRS Size Reducer
        </h1>

        <label className="font-semibold">Quality: {quality}% • Live Size Update</label>

        <input
          type="range"
          min="10"
          max="100"
          value={quality}
          onChange={handleSlider}
          className="w-full accent-blue-600 mb-3"
        />

        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="w-full border p-2 rounded-lg"
        />

        {preview && originalSize && (
          <div className="text-center bg-gray-50 border rounded-lg mt-4 p-3">
            <p className="font-bold">Original: {originalSize} KB</p>
            <p className="font-bold text-green-600">
              {compressedSize
                ? `Compressed: ${compressedSize} KB`
                : `Estimated: ${estimatedSize} KB`}
            </p>
            <p className="text-blue-500 text-sm">Reduced: {reducedPercent}%</p>
          </div>
        )}

        {preview && (
          <>
            <img src={preview} className="rounded-lg border mt-4" alt="" />

            {downloadURL && !isDownloaded && (
              <button
                onClick={handleDownload}
                className="mt-5 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold fixed bottom-4 left-2 right-2 z-50 shadow-lg"
              >
                ⬇ Download Compressed Image
              </button>
            )}

            <button
              onClick={handleDownload}
              className="mt-5 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold sticky bottom-0 left-0 right-0 z-50 shadow-xl mx-auto"
            >
              ⬇ Download Compressed Image
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default KBReducer;
