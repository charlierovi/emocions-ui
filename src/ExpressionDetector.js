// src/ExpressionDetector.js
/* global faceapi */

import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

// Traduccions de les expressions 
const expressionTranslations = {
  neutral: "Neutral",
  happy: "Feliç",
  sad: "Trist",
  angry: "Enfadat",
  fearful: "Espantat",
  disgusted: "Fàstic",
  surprised: "Sorprès",
};

// Colors segons l'expressió 
const expressionColors = {
  neutral: "#cccccc",
  happy: "#a5d6a7",
  sad: "#90caf9",
  angry: "#ef9a9a",
  fearful: "#ffcc80",
  disgusted: "#ce93d8",
  surprised: "#fff59d",
};

const MODEL_URL = "/models";

const ExpressionDetector = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detectedExpression, setDetectedExpression] = useState("Cap");
  const [bgColor, setBgColor] = useState("#ffffff");

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

        setModelsLoaded(true);
        startDetection();
      } catch (error) {
        console.error("Error carregant els models:", error);
      }
    };

    loadModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startDetection = () => {
    setInterval(async () => {
      if (
        !webcamRef.current ||
        !webcamRef.current.video ||
        webcamRef.current.video.readyState !== 4
      ) {
        return;
      }

      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      if (!videoWidth || !videoHeight) return;

      video.width = videoWidth;
      video.height = videoHeight;

      if (!canvasRef.current) return;
      const canvas = canvasRef.current;

      canvas.width = videoWidth;
      canvas.height = videoHeight;

      const detections = await faceapi
        .detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.5,
          })
        )
        .withFaceLandmarks()
        .withFaceExpressions();

      const displaySize = { width: videoWidth, height: videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (detections.length > 0) {
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

        const expressions = detections[0].expressions;
        const dominantExpression = Object.keys(expressions).reduce((a, b) =>
          expressions[a] > expressions[b] ? a : b
        );

        setDetectedExpression(
          expressionTranslations[dominantExpression] || dominantExpression
        );

        const newColor = expressionColors[dominantExpression] || "#ffffff";
        setBgColor(newColor);
      }
    }, 500);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: bgColor,
        transition: "background-color 0.5s ease",
      }}
    >
      <h1>Detector d&apos;Expressions Facials</h1>
      <p>
        Estat d&apos;ànim detectat: <strong>{detectedExpression}</strong>
      </p>

      {!modelsLoaded ? (
        <p>Carregant models d&apos;IA, si us plau, espereu...</p>
      ) : (
        <p>Models carregats!</p>
      )}

      <div style={{ position: "relative" }}>
        <Webcam
          ref={webcamRef}
          audio={false}
          style={{
            width: 640,
            height: 480,
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
      </div>
    </div>
  );
};

export default ExpressionDetector;