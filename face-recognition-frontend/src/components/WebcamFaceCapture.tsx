'use client';

import { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { api } from '@/libs/api';

// Type for IP data response
interface IpData {
    ip?: string;
    city?: string;
    region?: string;
    country_name?: string;
    latitude?: number;
    longitude?: number;
}

export default function WebcamFaceCapture() {
    const webcamRef = useRef<Webcam>(null);
    const [message, setMessage] = useState('');
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [debugInfo, setDebugInfo] = useState('');

    useEffect(() => {
        const loadModels = async () => {
            try {
                setMessage('Loading face detection models...');
                setDebugInfo('Starting model loading...');

                // Use CDN models since local models are missing
                const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

                setDebugInfo('Loading TinyFaceDetector...');
                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);

                setDebugInfo('Loading FaceRecognitionNet...');
                await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

                setDebugInfo('Loading FaceLandmark68Net...');
                await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

                setModelsLoaded(true);
                setMessage('Models loaded successfully!');
                setDebugInfo('All models loaded successfully');
            } catch (error) {
                console.error('Error loading models:', error);
                setMessage('Error loading face detection models. Please refresh the page.');
                setDebugInfo(`Model loading error: ${error}`);
            }
        };

        loadModels();
    }, []);

    const handleVideoReady = () => {
        setIsVideoReady(true);
        setMessage('Camera ready. Click "Scan & Save Face" to detect.');
        setDebugInfo('Video stream ready');
    };

    const detectAndSend = async () => {
        if (!webcamRef.current || !modelsLoaded || !isVideoReady) {
            setMessage('Please wait for camera and models to be ready.');
            setDebugInfo(`Ready check: webcam=${!!webcamRef.current}, models=${modelsLoaded}, video=${isVideoReady}`);
            return;
        }

        setIsProcessing(true);
        setMessage('Processing...');
        setDebugInfo('Starting face detection...');

        try {
            const video = webcamRef.current.video;
            console.dir({ video });
            if (!video || video.readyState !== 4) {
                setMessage('Video not ready. Please wait a moment and try again.');
                setDebugInfo(`Video readyState: ${video?.readyState}`);
                return;
            }

            // Wait for video to be fully loaded
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                setMessage('Video not loaded. Please wait and try again.');
                setDebugInfo(`Video dimensions: ${video.videoWidth}x${video.videoHeight}`);
                return;
            }

            setDebugInfo(`Video ready: ${video.videoWidth}x${video.videoHeight}, readyState: ${video.readyState}`);

            console.log('Detecting face...', {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                readyState: video.readyState
            });

            setDebugInfo('Running face detection...');
            const detection = await faceapi
                .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setMessage('No face detected. Please position your face in the camera.');
                setDebugInfo('No face detected in image');
                return;
            }

            console.log('Face detected:', detection);
            setDebugInfo('Face detected successfully');

            const descriptor = Array.from(detection.descriptor);
            const image = webcamRef.current.getScreenshot();
            console.log({ image });
            const device = navigator.userAgent;

            setDebugInfo('Fetching location data...');
            // Get IP + location
            let ipData: IpData = {};
            try {
                const ipResponse = await api.get('/face/location');
                ipData = ipResponse.data;
                console.log(ipData);
                setDebugInfo('Location data fetched');
            } catch (error) {
                console.warn('Could not fetch location data:', error);
                setDebugInfo('Location fetch failed, using defaults');
            }

            const payload = {
                descriptor,
                image,
                device,
                location: {
                    ip: ipData.ip || 'unknown',
                    city: ipData.city || 'unknown',
                    region: ipData.region || 'unknown',
                    country: ipData.country_name || 'unknown',
                    latitude: ipData.latitude || 0,
                    longitude: ipData.longitude || 0,
                },
            };

            setDebugInfo('Sending to backend...');
            console.log('Sending payload to backend...');
            const res = await api.post('/face/check-or-save', payload);
            setMessage(res.data.message || 'Face processed successfully!');
            setDebugInfo('Backend response received');

        } catch (err: any) {
            console.error('Error in detectAndSend:', err);
            setDebugInfo(`Error: ${err.message}`);

            if (err.response) {
                setMessage(`Server error: ${err.response.data?.message || 'Unknown error'}`);
            } else if (err.request) {
                setMessage('Network error: Could not connect to server. Is the backend running?');
            } else {
                setMessage('Error processing face data. Please try again.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-4 bg-white rounded shadow w-full max-w-lg mx-auto">
            <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width="100%"
                className="rounded"
                onUserMedia={handleVideoReady}
                mirrored={true}
            />
            <button
                onClick={detectAndSend}
                disabled={!modelsLoaded || !isVideoReady || isProcessing}
                className={`mt-4 w-full py-2 rounded font-medium ${!modelsLoaded || !isVideoReady || isProcessing
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
            >
                {isProcessing ? 'Processing...' : 'Scan & Save Face'}
            </button>
            <p className="text-sm mt-2 text-gray-600">{message}</p>
            <div className="text-xs mt-1 text-gray-400">
                Models: {modelsLoaded ? '✅' : '⏳'} | Camera: {isVideoReady ? '✅' : '⏳'}
            </div>
            <div className="text-xs mt-1 text-gray-500 bg-gray-100 p-2 rounded">
                <strong>Debug:</strong> {debugInfo}
            </div>
        </div>
    );
}
