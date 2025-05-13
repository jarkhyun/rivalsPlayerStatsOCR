import React, { useRef, useEffect, useState } from 'react';
import './App.css';
import Tesseract from 'tesseract.js';

function App() {
  const [file, setfile] = useState();
  const [progress, setProgress] = useState(0);
  const [inProgress, setInProgress] = useState(false);
  const [result, setResult] = useState('');

  const [hasPhoto, setHasPhoto] = useState(false);
  const videoRef = useRef(null);
  const photoRef = useRef(null);

  //camera

  const getVideo = () => {
    navigator.mediaDevices
    .getUserMedia({ 
      video: { width: 1280, height: 720}
    }).then(stream => {
      let video = videoRef.current;
      video.srcObject = stream;
      video.play();
    }).catch(err => {
      console.error(err);
    })
  }
  useEffect(() => {
    getVideo();
  }, [videoRef])
 
  const takePhoto = () => {
    const width = 414;
    const height = width / (16/9);

    let video = videoRef.current;
    let photo = photoRef.current;

    photo.width = width;
    photo.height = height;

    let ctx = photo.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);
    setHasPhoto(true);
  }
  const closePhoto = () => {
    let photo = photoRef.current;
    let ctx = photo.getContext('2d');
    ctx.clearRect(0, 0, photo.width, photo.height)
    setHasPhoto(false);
  }

  //text extractor

  const onFileChange = (e) => {
    setfile(e.target.files[0]);
  }
  const processImage = () => {
    console.log(file);
    Tesseract.recognize(
      file,"eng",
      { logger: (m) => {
          if (m.status==="recognizing text") {
            setProgress(m.progress);
            setInProgress(true);
            if (m.progress === 1 || m.progress === 0) {
              setInProgress(false);
          }}
        }
      }).then(({ data: { text } }) => {
      setResult(text);
    });
  };

  //rivals api

  const axios = require('axios');
  
  axios.get('https://marvelrivalsapi.com/api/v1/player/JohnDoe', {
    headers: { 'x-api-key': 'YOUR_API_KEY' }
  }).then(response => console.log(response.data)).catch(error => console.error(error));

  return (
    <div className="App">
      <div>
        <video ref={videoRef}></video>
        <button onClick={takePhoto}>Capture</button>
      </div>
      <div className={'result ' + (hasPhoto ? 'hasPhoto' : '')}>
        <canvas ref={photoRef}></canvas>
        <button onClick={closePhoto}>Close</button>
      </div>
      
      {file && <img src={URL.createObjectURL(file)} />}
      <div>
        {inProgress===true && <progress value={progress} max={1} />}
      </div>
      <input type="file" onChange={onFileChange} />
      <div>
        <input type="button" value="Submit" onClick={processImage}/>      
      </div>
      {result !=="" && result}
    </div>
  );
}

export default App;
