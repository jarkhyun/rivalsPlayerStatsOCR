import React, { useEffect, useState } from 'react';
import { createWorker } from 'tesseract.js';
// import Tesseract from 'tesseract.js';

const TextRecognition = ({ selectedImage }) => {
  const [recognizedText, setRecognizedText] = useState('');
  useEffect(() => {
    const recognizeText = async () => {
      if (selectedImage) {
        const worker = await createWorker('eng');
        const ret = await worker.recognize(selectedImage);
        console.log(ret.data.text);
        setRecognizedText(ret.data.text);
        await worker.terminate();
      }
    };
    recognizeText();
  }, [selectedImage]);
  return (
    <div>
      <h2>Recognized Text:</h2>
      <p>{recognizedText}</p>
    </div>
  );
};
export default TextRecognition;