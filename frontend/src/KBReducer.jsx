import React, { useState } from "react";
import axios from "axios";

const KBReducer = () => {
  const [quality, setQuality] = useState(60);
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
  };

  const handleDownload = () => {
    if (!downloadURL) return;
    setIsDownloaded(true);

    setTimeout(() => {
      window.location.href = downloadURL; // triggers file deletion on backend
    }, 300);
  };

  const reducedPercent =
    originalSize &&
    (((originalSize - (compressedSize || estimatedSize)) / originalSize) * 100).toFixed(1);

  return (
    <div className="min-h-screen flex justify-center items-center p-4 bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-xl w-full">

        <h1 className="text-2xl font-bold text-center text-blue-600 mb-4">
          SRS Size Reducer
        </h1>

        <label className="font-semibold">
          Quality: {quality}% • Live Size Update
        </label>
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

            <p className="text-blue-500 text-sm">
              Reduced: {reducedPercent}%
            </p>
          </div>
        )}

        {preview && (
          <>
            <img src={preview} className="rounded-lg border mt-4" alt="" />

            {downloadURL && !isDownloaded && (
              <button
                onClick={handleDownload}
                className="block mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold"
              >
                ⬇ Download Compressed
              </button>
            )}

            {isDownloaded && (
              <p className="text-green-600 mt-3 text-center font-semibold">
                File Downloaded
              </p>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default KBReducer;
