import React, { useRef, useEffect, useState } from 'react';

import * as tf from '@tensorflow/tfjs';

import * as cocoSsd from '@tensorflow-models/coco-ssd';



function App() {

  const videoRef = useRef(null);

  const canvasRef = useRef(null);

  const [model, setModel] = useState(null);

  const [targetObject, setTargetObject] = useState(null);



  useEffect(() => {

    const loadModel = async () => {

      try {

        const model = await cocoSsd.load();

        setModel(model);

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



        videoRef.current.onplaying = () => {

          videoRef.current.width = videoRef.current.videoWidth;

          videoRef.current.height = videoRef.current.videoHeight;

        };

      } catch (error) {

        console.error('Error accessing camera:', error);

      }

    };



    if (videoRef.current) {

      startCamera();

    }

  }, []);



  useEffect(() => {

    const detectObjects = async () => {

      if (model && videoRef.current && canvasRef.current) {

        const ctx = canvasRef.current.getContext('2d');

        const videoWidth = videoRef.current.videoWidth;

        const videoHeight = videoRef.current.videoHeight;



        canvasRef.current.width = videoWidth;

        canvasRef.current.height = videoHeight;



        const predictions = await model.detect(videoRef.current);



        ctx.clearRect(0, 0, videoWidth, videoHeight);

        ctx.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);



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



          if (targetObject && prediction.class.toLowerCase() === targetObject) {

            console.log('Target object found:', prediction.class);

            const audio = new Audio('target_object_found.mp3'); 

            audio.play();

          }

        });



        requestAnimationFrame(detectObjects);

      }

    };



    if (model) {

      detectObjects();

    }

  }, [model, targetObject]);



  return (

    <div>

      <video ref={videoRef} autoPlay playsInline muted />

      <canvas ref={canvasRef} />

    </div>

  );

}



export default App;