import React, { useRef, useEffect, useState } from 'react';
import './App.css';
import Tesseract from 'tesseract.js';

function App() {
  const [progress, setProgress] = useState(0);
  const [inProgress, setInProgress] = useState(false);
  const [result, setResult] = useState([]);
  const [text, setText] = useState([]);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

    processImage(data);
  }
  const closePhoto = () => {
    let photo = photoRef.current;
    let ctx = photo.getContext('2d');
    ctx.clearRect(0, 0, photo.width, photo.height)
    setHasPhoto(false);
  }

  // text extractor

  const processImage = (photo) => {
    Tesseract.recognize(
      photo,"eng",'2',
      { logger: (m) => {
          if (m.status==="recognizing text") {
            setProgress(m.progress);
            setInProgress(true);
            if (m.progress === 1 || m.progress === 0) {
              setInProgress(false);
          }}
        }
      }).then(({ data: { text } }) => {
        const strArr = text.replace(/\n/g,' ').split(' ').filter((word) => word.length >= 3);
        if (result.length === 0) {
          setResult(strArr);
        } else {
          setResult(result.concat(strArr));
          let s = new Set(result.filter((e, i, self) => i !== self.indexOf(e)));
          let a1 = [...s]
          setText(a1);
          createButtons(a1);
        }

    });
  };

  // const clearHistory = () => {
  //   setResult([]);
  // }

  //rivals api search

  const searchNames = (playerArr) => {
    setIsLoading(true);
    const arr2 =[];
    const arr3 = [];
    let ctr = 0;
    for (let i = 0; i < playerArr.length; i++) {
      if (playerArr[i] !== "") {
        const url = `https://marvelrivalsapi.com/api/v1/player/${playerArr[i]}`;
        // Make a request for a user with a given ID
        fetch(url, {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY
          }
        })
        .then(response => response.json())
        .then(data => {
          // handle success
          if (data.ok) {
            throw new Error(data.status);
          } else {
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
            
            document.getElementById("playerResults").innerHTML += `<div>${arr2[i].name}`;
            document.getElementById("playerResults").innerHTML += `<a href="https://tracker.gg/marvel-rivals/profile/ign/${arr2[i].name}/overview?season=4">Detailed Summary</a>`;
            if (arr2[i] && arr2[i].overall_stats.ranked.total_matches) {
              document.getElementById("playerResults").innerHTML += `<div> Overall Ranked Winrate: ${(arr2[i].overall_stats.ranked.total_wins / arr2[i].overall_stats.ranked.total_matches * 100).toFixed(2)}%</div>`
              if (res[0]) {
                document.getElementById("playerResults").innerHTML += `<div>Top Heroes: </div><div>1. ${res[0].hero_name} : ${res[0].wins} W // ${res[0].matches - res[0].wins} L. ${(res[0].wins / res[0].matches * 100).toFixed(2)}% ${(res[0].play_time / 3600).toFixed(2)} Hrs.</div>`
              }
              if (res[1]) {
                document.getElementById("playerResults").innerHTML += `<div>2. ${res[1].hero_name} : ${res[1].wins} W // ${res[1].matches - res[1].wins} L. ${(res[1].wins / res[1].matches * 100).toFixed(2)}% ${(res[1].play_time / 3600).toFixed(2)} Hrs.</div>`
              }
              if (res[2]) {
                document.getElementById("playerResults").innerHTML += `<div>3. ${res[2].hero_name} : ${res[2].wins} W // ${res[2].matches - res[2].wins} L. ${(res[2].wins / res[2].matches * 100).toFixed(2)}% ${(res[2].play_time / 3600).toFixed(2)} Hrs.</div>`
              }
            } else if (arr2[i].overall_stats.ranked.total_matches === 0) {
              document.getElementById("playerResults").innerHTML += `<div> No ranked data.</div>`
            } else {
              document.getElementById("playerResults").innerHTML += "<div>Error. Please try again.</div>"
            }
            document.getElementById("playerResults").innerHTML += `<div><div></div></div>`

          }
        })
        .catch(function (error) {
          // handle error
          console.log(error);
        })
        .finally(function () {
          // always executed
          setIsLoading(false);
        });
      }
    };
  }
  
  const createButtons = (fil) => {
    let playerArr = [];
    document.getElementById("textselect").innerHTML = "";
    for (var i = 0; i < fil.length; i++) {
      document.getElementById("textselect").innerHTML += `<div id='search'><input type='text' class='search' id="input${i}" minLength={3} maxLength={14} value='${fil[i]}'></input><input type='checkbox' class='checkbox' id="createdCheck${i}" name="input${i}"></input></div>`;
    }
    if (fil.length > 0) {
      document.getElementById("textselect").innerHTML += "<div><button type='submit' id='submitAll'>Search</button></div>";
      document.getElementById("submitAll").addEventListener("click", () => {
        for (var i = 0; i < fil.length; i++) {
          const check = document.getElementById(`createdCheck${i}`);
          if (check.checked === true) {
            playerArr.push(document.getElementById(check.name).value);
          }
        }
        searchNames(playerArr);
        playerArr = [];
      }, false);
    }
  }

  return (
    <div className="App">
      <div>
        <video ref={videoRef} className={(hasPhoto ? 'hidden' : '')}></video>
        <button className={(hasPhoto ? 'hidden' : '')} id="capture" onClick={takePhoto}>Capture</button>
      </div>
      <canvas className={(hasPhoto ? '' : 'hidden')} ref={photoRef}></canvas>
      {/* <button id="submit" className={(hasPhoto && !ocrDisable ? '' : 'hidden')} onClick={processImage}>OCR</button> */}
      <button id="close" className={(hasPhoto ? '' : 'hidden')} onClick={closePhoto}>Close</button>
      {inProgress===true && <progress id="center" value={progress} max={1} />}
      <div>
        <div>
          <div className={(result.length > 0 ? '' : 'hidden')}>{(text.length === 0 ? 'REQUIRES MORE INFO' : 'Text recognition results: ')} </div>
          {/* <div className={(result.length > 0 ? '' : 'hidden')}>{text.join(' ')}</div> */}
          <div id="textselect" className={(result.length > 0 ? '' : 'hidden')}></div>
        </div>
        <div>
          <div id="playerResults"></div>
          {isLoading===true && <div>Loading...</div>}
        </div>
      </div>
    </div>
  );
};

export default App;
