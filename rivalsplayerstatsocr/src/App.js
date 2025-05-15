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
    setPlayers([]);
    setHeroes([]);
    const arr = [];
    const arr2 =[];
    const arr3 = [];
    let ctr = 0;
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
          if (data.ok && data.error !== true) {
            arr2.push(data);
            let fst = {play_time: -Infinity}, sec = {play_time: -Infinity}, thd = {play_time: -Infinity};
            arr2[ctr].heroes_ranked.forEach(x => {
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
            arr3.push(res);
            ctr++;
          } else if (!data.ok) {
            throw new Error(`Response status: ${data.status}`);
          }
        })
        .catch(function (error) {
          // handle error
          console.log(error);
        })
        .finally(function () {
          // always executed
          setPlayers(arr2);
          setHeroes(arr3);
          setIsLoading(false);
        });
      }
    };
  }

    useEffect(() => {
      console.log(heroes);
      if (heroes) {setIsLoading(false)}; 
    },[heroes]);

  return (
    <div className="App">
      <div>
        <video ref={videoRef} className={(hasPhoto ? 'hidden' : '')}></video>
        <button className={(hasPhoto ? 'hidden' : '')} id="capture" onClick={takePhoto}>Capture</button>
      </div>
      {inProgress===true && <progress id="center" value={progress} max={1} />}
      <canvas className={(hasPhoto ? '' : 'hidden')} ref={photoRef}></canvas>
      <button id="submit" className={(hasPhoto ? '' : 'hidden')} onClick={processImage}>OCR</button>
      <button id="close" className={(hasPhoto ? '' : 'hidden')} onClick={closePhoto}>Close</button>
      <div>
        <div>
          <div className={(result ? '' : 'hidden')}>Text recognition results: </div>
          <div className={(result ? '' : 'hidden')}>{result}</div>
        </div>
        <input type="text" minLength={3} maxLength={14} id="player1" placeholder='Player 1' ></input><br></br>
        <input type="text" minLength={3} maxLength={14} id="player2" placeholder='Player 2'></input><br></br>
        <input type="text" minLength={3} maxLength={14} id="player3" placeholder='Player 3'></input><br></br>
        <input type="text" minLength={3} maxLength={14} id="player4" placeholder='Player 4'></input><br></br>
        <input type="text" minLength={3} maxLength={14} id="player5" placeholder='Player 5'></input><br></br>
        <input type="text" minLength={3} maxLength={14} id="player6" placeholder='Player 6'></input><br></br>
        <button id="search" onClick={searchNames}>Search</button>
      </div>
      <div id="players">
        {isLoading !== true && (
          <>
            {players[5] && 
              <div id="player">
                {players[5].overall_stats.ranked.total_matches && <div>{players[5].name} Overall Ranked Winrate: {(players[5].overall_stats.ranked.total_wins / players[5].overall_stats.ranked.total_matches * 100).toFixed(2) }%</div>}
                <div>Top Heroes: </div>
                {heroes[5][0] && <div>1. {heroes[5][0].hero_name} : {heroes[5][0].wins} W // {heroes[5][0].matches - heroes[5][0].wins} L. {(heroes[5][0].wins / heroes[5][0].matches * 100).toFixed(2) }%</div>}
                {heroes[5][1] && <div>2. {heroes[5][1].hero_name} : {heroes[5][1].wins} W // {heroes[5][1].matches - heroes[5][1].wins} L. {(heroes[5][1].wins / heroes[5][1].matches * 100).toFixed(2) }%</div>}
                {heroes[5][2] && <div>3. {heroes[5][2].hero_name} : {heroes[5][2].wins} W // {heroes[5][2].matches - heroes[5][2].wins} L. {(heroes[5][2].wins / heroes[5][2].matches * 100).toFixed(2) }%</div>} 
              
              </div> 
            }
            {players[4] && 
              <div id="player">
                {players[4].overall_stats.ranked.total_matches && <div>{players[4].name} Overall Ranked Winrate: {(players[4].overall_stats.ranked.total_wins / players[4].overall_stats.ranked.total_matches * 100).toFixed(2) }%</div>}
                <div>Top Heroes: </div>
                {heroes[4][0] && <div>1. {heroes[4][0].hero_name} : {heroes[4][0].wins} W // {heroes[4][0].matches - heroes[4][0].wins} L. {(heroes[4][0].wins / heroes[4][0].matches * 100).toFixed(2) }%</div>}
                {heroes[4][1] && <div>2. {heroes[4][1].hero_name} : {heroes[4][1].wins} W // {heroes[4][1].matches - heroes[4][1].wins} L. {(heroes[4][1].wins / heroes[4][1].matches * 100).toFixed(2) }%</div>}
                {heroes[4][2] && <div>3. {heroes[4][2].hero_name} : {heroes[4][2].wins} W // {heroes[4][2].matches - heroes[4][2].wins} L. {(heroes[4][2].wins / heroes[4][2].matches * 100).toFixed(2) }%</div>} 
              
              </div>
            }
            {players[3] && 
              <div id="player">
                {players[3].overall_stats.ranked.total_matches && <div>{players[3].name} Overall Ranked Winrate: {(players[3].overall_stats.ranked.total_wins / players[3].overall_stats.ranked.total_matches * 100).toFixed(2) }%</div>}
                <div>Top Heroes: </div>
                {heroes[3][0] && <div>1. {heroes[3][0].hero_name} : {heroes[3][0].wins} W // {heroes[3][0].matches - heroes[3][0].wins} L. {(heroes[3][0].wins / heroes[3][0].matches * 100).toFixed(2) }%</div>}
                {heroes[3][1] && <div>2. {heroes[3][1].hero_name} : {heroes[3][1].wins} W // {heroes[3][1].matches - heroes[3][1].wins} L. {(heroes[3][1].wins / heroes[3][1].matches * 100).toFixed(2) }%</div>}
                {heroes[3][2] && <div>3. {heroes[3][2].hero_name} : {heroes[3][2].wins} W // {heroes[3][2].matches - heroes[3][2].wins} L. {(heroes[3][2].wins / heroes[3][2].matches * 100).toFixed(2) }%</div>} 
              
              </div>
            }
            {players[2] && 
              <div id="player">
                {players[2].overall_stats.ranked.total_matches && <div>{players[2].name} Overall Ranked Winrate: {(players[2].overall_stats.ranked.total_wins / players[2].overall_stats.ranked.total_matches * 100).toFixed(2) }%</div>}
                <div>Top Heroes: </div>
                {heroes[2][0] && <div>1. {heroes[2][0].hero_name} : {heroes[2][0].wins} W // {heroes[2][0].matches - heroes[2][0].wins} L. {(heroes[2][0].wins / heroes[2][0].matches * 100).toFixed(2) }%</div>}
                {heroes[2][1] && <div>2. {heroes[2][1].hero_name} : {heroes[2][1].wins} W // {heroes[2][1].matches - heroes[2][1].wins} L. {(heroes[2][1].wins / heroes[2][1].matches * 100).toFixed(2) }%</div>}
                {heroes[2][2] && <div>3. {heroes[2][2].hero_name} : {heroes[2][2].wins} W // {heroes[2][2].matches - heroes[2][2].wins} L. {(heroes[2][2].wins / heroes[2][2].matches * 100).toFixed(2) }%</div>} 
              
              </div>
            } 
            {players[1] && 
              <div id="player">
                {players[1].overall_stats.ranked.total_matches && <div>{players[1].name} Overall Ranked Winrate: {(players[1].overall_stats.ranked.total_wins / players[1].overall_stats.ranked.total_matches * 100).toFixed(2) }%</div>}
                <div>Top Heroes: </div>
                {heroes[1][0] && <div>1. {heroes[1][0].hero_name} : {heroes[1][0].wins} W // {heroes[1][0].matches - heroes[1][0].wins} L. {(heroes[1][0].wins / heroes[1][0].matches * 100).toFixed(2) }%</div>}
                {heroes[1][1] && <div>2. {heroes[1][1].hero_name} : {heroes[1][1].wins} W // {heroes[1][1].matches - heroes[1][1].wins} L. {(heroes[1][1].wins / heroes[1][1].matches * 100).toFixed(2) }%</div>}
                {heroes[1][2] && <div>3. {heroes[1][2].hero_name} : {heroes[1][2].wins} W // {heroes[1][2].matches - heroes[1][2].wins} L. {(heroes[1][2].wins / heroes[1][2].matches * 100).toFixed(2) }%</div>} 
              
              </div>
            }
            {players[0] && 
              <div id="player">
                {players[0].overall_stats.ranked.total_matches && <div>{players[0].name} Overall Ranked Winrate: {(players[0].overall_stats.ranked.total_wins / players[0].overall_stats.ranked.total_matches * 100).toFixed(2) }%</div>}
                <div>Top Heroes: </div>
                {heroes[0][0] && <div>1. {heroes[0][0].hero_name} : {heroes[0][0].wins} W // {heroes[0][0].matches - heroes[0][0].wins} L. {(heroes[0][0].wins / heroes[0][0].matches * 100).toFixed(2) }%</div>}
                {heroes[0][1] && <div>2. {heroes[0][1].hero_name} : {heroes[0][1].wins} W // {heroes[0][1].matches - heroes[0][1].wins} L. {(heroes[0][1].wins / heroes[0][1].matches * 100).toFixed(2) }%</div>}
                {heroes[0][2] && <div>3. {heroes[0][2].hero_name} : {heroes[0][2].wins} W // {heroes[0][2].matches - heroes[0][2].wins} L. {(heroes[0][2].wins / heroes[0][2].matches * 100).toFixed(2) }%</div>} 
              
              </div>
            }
          </>
        )}
      </div>
    </div>
  );
};

export default App;
