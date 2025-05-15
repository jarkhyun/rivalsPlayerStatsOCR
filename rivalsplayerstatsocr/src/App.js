import React, { useRef, useEffect, useState } from 'react';
import './App.css';
import Tesseract from 'tesseract.js';
import axios from "axios";

function App() {
  const [file, setfile] = useState();
  const [progress, setProgress] = useState(0);
  const [inProgress, setInProgress] = useState(false);
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [players,setPlayers] = useState([]);
  const [heroes, setHeroes] = useState([]);
  const [hasPhoto, setHasPhoto] = useState(false);
  const videoRef = useRef(null);
  const photoRef = useRef(null);

  //camera

  const getVideo = () => {
    navigator.mediaDevices
    .getUserMedia({ 
      video: {facingMode: 'environment'}, audio: false 
    }).then(stream => {
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
    const arr3 = []
    for (let i = 0; i < 6; i++) {
      setIsLoading(true);
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
        .then(response => response.json())
        .then(data => {
          // handle success
          arr2.push(data);

          let fst = {play_time: -Infinity}, sec = {play_time: -Infinity}, thd = {play_time: -Infinity};
          for (let i = 0; i < arr2.length; i++) {
            arr2[i].heroes_ranked.forEach(x => {
            // If current element is greater than fst
            if (x.play_time > fst.play_time) {
              thd = sec;
              sec = fst;
              fst = x;
            }
            // If x is between fst and sec
            else if (x.play_time > sec.play_time && x.play_time !== fst.play_time) {
              thd = sec;
              sec = x;
            }
            // If x is between sec and thd
            else if (x.play_time > thd.play_time && x.play_time !== sec && x.play_time !== fst.play_time) {
                thd = x;
            }
          })
          let res = [];
          if (fst.play_time !== -Infinity) res.push(fst);
          if (sec.play_time !== -Infinity) res.push(sec);
          if (thd.play_time !== -Infinity) res.push(thd); 
          }
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
    setHeroes(arr3);
    setIsLoading(false);
  }

        // players[i].heroes_ranked[j].hero_name
        // players[i].heroes_ranked[j].wins
        // players[i].heroes_ranked[j].matches
        // players[i].heroes_ranked[j].play_time

  return (
    <div className="App">
      <div>
        <video ref={videoRef}></video>
        <button onClick={takePhoto}>Capture</button>
      </div>
      <div className={'result ' + (hasPhoto ? 'hasPhoto' : '')}>
        {inProgress===true && <progress id="center" value={progress} max={1} />}
        <canvas ref={photoRef}></canvas>
        <button id="close" onClick={closePhoto}>Close</button>
        <button id="submit" onClick={processImage}>OCR</button>
        {/* <div id="center">{result !=="" && result}</div> */}
        <div>
          <input type="text" minLength={3} maxLength={14} id="player1" placeholder='Player 1' ></input><br></br>
          <input type="text" minLength={3} maxLength={14} id="player2" placeholder='Player 2'></input><br></br>
          <input type="text" minLength={3} maxLength={14} id="player3" placeholder='Player 3'></input><br></br>
          <input type="text" minLength={3} maxLength={14} id="player4" placeholder='Player 4'></input><br></br>
          <input type="text" minLength={3} maxLength={14} id="player5" placeholder='Player 5'></input><br></br>
          <input type="text" minLength={3} maxLength={14} id="player6" placeholder='Player 6'></input><br></br>
          <button id="search" onClick={searchNames}>Search</button>
        </div>
        <div id="stats">
          {isLoading !== true && (
            <>
              {players[0] && 
              <div>
                <div>{players[0].name}</div>
                {players[0].overall_stats.ranked.total_matches && <div>Overall Ranked Winrate: {players[0].overall_stats.ranked.total_wins / players[0].overall_stats.ranked.total_matches}%</div>}
                <div>Top Heroes: </div>
                {heroes[0].hero_name && <div>1. {heroes[0].hero_name} : {players[0].heroes_ranked[0].wins} wins of {heroes[0].matches} matches. </div>}
                {heroes[0].heroes_ranked[1].hero_name && <div>2. {heroes[1].hero_name} : {heroes[1].wins} wins of {heroes[1].matches} matches. </div>}
                {heroes[0].heroes_ranked[2].hero_name && <div>3. {heroes[2].hero_name} : {heroes[2].wins} wins of {heroes[2].matches} matches. </div>}
              </div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function longestHeroPlaytime (arr) {
  let fst = -Infinity, sec = -Infinity, thd = -Infinity;
  arr.forEach(x => {
    // If current element is greater than fst
    if (x.play_time > fst) {
        thd = sec;
        sec = fst;
        fst = x;
    }
    // If x is between fst and sec
    else if (x.play_time > sec.play_time && x.play_time !== fst.play_time) {
        thd = sec;
        sec = x;
    }
    // If x is between sec and thd
    else if (x.play_time > thd.play_time && x.play_time !== sec.play_time && x.play_time !== fst.play_time) {
        thd = x;
    }
  });

  let res = [];
  if (fst !== -Infinity) res.push(fst);
  if (sec !== -Infinity) res.push(sec);
  if (thd !== -Infinity) res.push(thd);

  return res;
}

export default App;
