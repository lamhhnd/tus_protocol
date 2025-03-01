import React, { useState } from "react";
import * as tus from "tus-js-client";

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [speed, setSpeed] = useState<number>(0);
  const [lastUploaded, setLastUploaded] = useState<number>(0);
  const [lastTime, setLastTime] = useState<number>(Date.now());
  const [startTime, setStartTime] = useState<number>(Date.now()); // ✅ KHỞI TẠO THỜI GIAN BẮT ĐẦU
  const [totalTime, setTotalTime] = useState<number>(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProgress(0);
    setSpeed(0);
    setMessage("");
    setLastUploaded(0);
    setTotalTime(0);
    setStartTime(Date.now()); 
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) return;

    setStartTime(Date.now()); 
    setTotalTime(0);

    const upload = new tus.Upload(file, {
      endpoint: "http://localhost:1080/files/",
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: { filename: file.name, filetype: file.type },

      onError: (error) => setMessage("Upload failed: " + error),

      onProgress: (bytesUploaded, bytesTotal) => {
        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000;
        const uploadedDiff = bytesUploaded - lastUploaded;
        const uploadSpeed = uploadedDiff / (timeDiff || 1);

        setProgress((bytesUploaded / bytesTotal) * 100);
        setSpeed(uploadSpeed);
        setLastUploaded(bytesUploaded);
        setLastTime(now);

        setTotalTime((now - startTime) / 1000); 
      },

      onSuccess: () => {
        setMessage("File uploaded successfully!");
        setTotalTime((Date.now() - startTime) / 1000); 
      },
    });

    upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length) upload.resumeFromPreviousUpload(previousUploads[0]);
      upload.start();
    });

    setSpeed(0);
    setLastUploaded(0);
    setLastTime(Date.now());
  };

  const formatSpeed = (speed: number) => {
    if (speed > 1024 * 1024) return (speed / (1024 * 1024)).toFixed(2) + " MB/s";
    if (speed > 1024) return (speed / 1024).toFixed(2) + " KB/s";
    return speed.toFixed(2) + " B/s";
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {progress > 0 && <p>Upload Progress: {progress.toFixed(2)}%</p>}
      {speed > 0 && <p>Upload Speed: {formatSpeed(speed)}</p>}
      {totalTime > 0 && <p>Total Time: {totalTime.toFixed(2)} seconds</p>}
      {message && <p>{message}</p>}
    </div>
  );
};

export default FileUpload;
