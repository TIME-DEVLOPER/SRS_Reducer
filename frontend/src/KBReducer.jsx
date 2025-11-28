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
    }, 400);
  };

  const handleDownload = async () => {
    if (!downloadURL) return;
    setIsDownloaded(true);

    try {
      const response = await fetch(downloadURL);
      const blob = await response.blob();

      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(blob);
      a.download = "compressed-image.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => window.URL.revokeObjectURL(a.href), 2000);

    } catch (error) {
      console.warn("Blob failed → fallback → server delete safe");
      window.location.href = downloadURL;
    }
  };

  const reducedPercent =
    originalSize &&
    (((originalSize - (compressedSize || estimatedSize)) / originalSize) * 100).toFixed(1);

  return (
    <div className="min-h-screen flex justify-center items-start p-4 bg-gray-100 pb-32 overflow-y-auto">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-xl w-full">

        <h1 className="text-2xl font-bold text-center text-blue-600 mb-4">
          SRS Size Reducer
        </h1>

        <label className="font-semibold mb-1 block">
          Quality: {quality}% • Live Size Update
        </label>

        <input
          type="range"
          min="10"
          max="100"
          value={quality}
          onChange={handleSlider}
          className="w-full accent-blue-600 mb-4"
        />

        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="w-full border p-2 rounded-lg"
        />

        {preview && originalSize && (
          <div className="text-center bg-gray-50 border rounded-lg mt-4 p-3">
            <p className="font-bold text-black">Original: {originalSize} KB</p>
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
            <img
              src={preview}
              className="rounded-lg border mt-4 w-full max-h-[60vh] object-contain"
              alt=""
            />

            {downloadURL && !isDownloaded && (
              <button
                onClick={handleDownload}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold sticky bottom-2 mt-6 shadow-xl"
              >
                ⬇ Download Compressed Image
              </button>
            )}

            {isDownloaded && (
              <p className="text-green-700 mt-3 text-center font-semibold">
                ✔ Downloading… Files Deleted Securely 🔐
              </p>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default KBReducer;
