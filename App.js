import React, { useRef, useEffect, useState } from 'react';

import '@tensorflow/tfjs';

import * as cocoSsd from '@tensorflow-models/coco-ssd';



function App() {

  const videoRef = useRef(null);

  const canvasRef = useRef(null);

  const [model, setModel] = useState(null);

  const [targetObject, setTargetObject] = useState('');



  const targetRef = useRef('');

  const lastSpoken = useRef(0);



  useEffect(() => {

    targetRef.current = targetObject;

  }, [targetObject]);



  useEffect(() => {

    const loadModel = async () => {

      try {

        const loaded = await cocoSsd.load();

        setModel(loaded);

        console.log('Model loaded');

      } catch (error) {

        console.error('Error loading model:', error);

      }

    };

    loadModel();

  }, []);



  useEffect(() => {

    const startCamera = async () => {

      try {

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });

        videoRef.current.srcObject = stream;

      } catch (error) {

        console.error('Error accessing camera:', error);

      }

    };

    if (videoRef.current) {

      startCamera();

    }

  }, []);



  const announce = (prediction, frameWidth) => {

    const now = Date.now();

    if (now - lastSpoken.current < 3000) return;



    const [x, , width] = prediction.bbox;

    const center = x + width / 2;

    const side = center < frameWidth / 3 ? 'on your left'

               : center > (2 * frameWidth) / 3 ? 'on your right'

               : 'straight ahead';



    window.speechSynthesis.speak(

      new SpeechSynthesisUtterance(`${prediction.class}, ${side}`)

    );

    lastSpoken.current = now;

  };



  useEffect(() => {

    if (!model) return;

    let frameId;



    const detectObjects = async () => {

      const video = videoRef.current;

      const canvas = canvasRef.current;



      if (video && canvas && video.readyState === 4) {

        const ctx = canvas.getContext('2d');

        const w = video.videoWidth;

        const h = video.videoHeight;

        canvas.width = w;

        canvas.height = h;



        const predictions = await model.detect(video);



        ctx.clearRect(0, 0, w, h);

        ctx.drawImage(video, 0, 0, w, h);



        predictions.forEach((prediction) => {

          ctx.beginPath();

          ctx.rect(...prediction.bbox);

          ctx.lineWidth = 2;

          ctx.strokeStyle = 'green';

          ctx.fillStyle = 'green';

          ctx.stroke();

          ctx.fillText(

            `${prediction.class} - ${Math.round(prediction.score * 100)}%`,

            prediction.bbox[0],

            prediction.bbox[1] > 10 ? prediction.bbox[1] - 5 : 10

          );



          const target = targetRef.current;

          if (target && prediction.class.toLowerCase() === target) {

            announce(prediction, w);

          }

        });

      }



      frameId = requestAnimationFrame(detectObjects);

    };



    detectObjects();

    return () => cancelAnimationFrame(frameId);

  }, [model]);



  return (

    <div>

      <input

        placeholder="What are you looking for? (e.g. cup, bottle, chair)"

        value={targetObject}

        onChange={(e) => setTargetObject(e.target.value.trim().toLowerCase())}

      />

      <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />

      <canvas ref={canvasRef} />

    </div>

  );

}



export default App;
