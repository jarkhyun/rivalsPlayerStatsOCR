import React, { useRef, useEffect, useState } from 'react';
import './App.css';
import Tesseract from 'tesseract.js';
import axios from "axios";

function App() {
  const [file, setfile] = useState();
  const [progress, setProgress] = useState(0);
  const [inProgress, setInProgress] = useState(false);
  const [result, setResult] = useState('');
  const [players,setPlayers] = useState([]);

  const [hasPhoto, setHasPhoto] = useState(false);
  const videoRef = useRef(null);
  const photoRef = useRef(null);

  //camera

  const getVideo = () => {
    navigator.mediaDevices
    .getUserMedia({ 
      video: true, audio: false
    },{facingMode: "environment"}).then(stream => {
      let video = videoRef.current;
      video.srcObject = stream;
      video.play();
    }).catch(err => {
      console.log(err);
    })
  }
  useEffect(() => {
    getVideo();
  }, [videoRef])
 
  const takePhoto = () => {
    const width = videoRef.current.clientWidth;
    const height = videoRef.current.clientHeight;

    let video = videoRef.current;
    let photo = photoRef.current;

    photo.width = width;
    photo.height = height;

    let ctx = photo.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    setHasPhoto(true);

    const data = photo.toDataURL("image/png");
    setfile(data);
  }
  const closePhoto = () => {
    let photo = photoRef.current;
    let ctx = photo.getContext('2d');
    ctx.clearRect(0, 0, photo.width, photo.height)
    setHasPhoto(false);
  }

  // text extractor

  const processImage = () => {
    Tesseract.recognize(
      file,"eng",'2',
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

  //rivals api search

  const searchNames = () => {
    const arr = [];
    const arr2 =[];
    for (let i = 0; i < 6; i++) {
      arr[i] = document.getElementById(`player${i + 1}`).value;
      if (arr[i] !== "") {
        const axios = require('axios');
        const url = `https://marvelrivalsapi.com/api/v1/player/${arr[i]}`;
        // Make a request for a user with a given ID
        fetch(url, {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY
          }
        })
        .then(function (response) {
          // handle success
          arr2.push(response.data);
        })
        .catch(function (error) {
          // handle error
          console.log(error);
        })
        .finally(function () {
          // always executed
        });
      }
    };
    setPlayers(arr2);
  }

  console.log(players);

  return (
    <div className="App">
      <div>
        <video ref={videoRef}></video>
        <button onClick={takePhoto}>Capture</button>
      </div>
      <div className={'result ' + (hasPhoto ? 'hasPhoto' : '')}>
        <canvas ref={photoRef}></canvas>
        <button id="close" onClick={closePhoto}>Close</button>
        <button id="submit" onClick={processImage}>Capture</button>
        {inProgress===true && <progress id="center" value={progress} max={1} />}
        <div id="center">{result !=="" && result}</div>
        <div>
          <input type="text" minLength={3} maxLength={14} id="player1" placeholder='Player 1' ></input><br></br>
          <input type="text" minLength={3} maxLength={14} id="player2" placeholder='Player 2'></input><br></br>
          <input type="text" minLength={3} maxLength={14} id="player3" placeholder='Player 3'></input><br></br>
          <input type="text" minLength={3} maxLength={14} id="player4" placeholder='Player 4'></input><br></br>
          <input type="text" minLength={3} maxLength={14} id="player5" placeholder='Player 5'></input><br></br>
          <input type="text" minLength={3} maxLength={14} id="player6" placeholder='Player 6'></input><br></br>
          <button id="search" onClick={searchNames}>Search</button>
        </div>
        {players && <div />}
      </div>
    </div>
  );
};

export default App;
