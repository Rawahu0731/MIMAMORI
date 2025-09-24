import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface PoseDetectorProps {
  onPoseDetected?: (poseData: {
    shoulderY: number;
    ankleY: number;
    heightDiff: number;
    isSameHeight: boolean;
  }) => void;
}

export const PoseDetector: React.FC<PoseDetectorProps> = ({ onPoseDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('初期化中...');
  
  const [showDebugVideo, setShowDebugVideo] = useState(false);
  const prevShoulderYRef = useRef<number | null>(null);

  // MediaPipe PoseLandmarkerを初期化
  const initializePoseLandmarker = useCallback(async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      setPoseLandmarker(landmarker);
      setIsLoading(false);
      setStatus('準備完了');
    } catch (err) {
      console.error('PoseLandmarker初期化エラー:', err);
      setError('PoseLandmarkerの初期化に失敗しました');
      setIsLoading(false);
    }
  }, []);

  // Webカメラを開始
  const startCamera = useCallback(async () => {
    try {
      console.log('カメラの取得を開始...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      console.log('カメラストリーム取得成功:', stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('ビデオ要素にストリームを設定');
        
        // ビデオが再生開始されるのを待つ
        videoRef.current.onloadedmetadata = () => {
          console.log('ビデオメタデータ読み込み完了');
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              console.log('ビデオ再生開始');
              setStatus('カメラ準備完了');
            }).catch(playErr => {
              console.error('ビデオ再生エラー:', playErr);
              setError('ビデオの再生に失敗しました');
            });
          }
        };
      }
    } catch (err) {
      console.error('カメラアクセスエラー:', err);
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      setError(`カメラにアクセスできませんでした: ${errorMessage}`);
    }
  }, []);

  // ポーズ検出とレンダリング
  const detectPose = useCallback(() => {
    if (!poseLandmarker || !videoRef.current || !canvasRef.current) {
      console.log('detectPose: 必要な要素が不足', {
        poseLandmarker: !!poseLandmarker,
        video: !!videoRef.current,
        canvas: !!canvasRef.current
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('detectPose: コンテキストまたはビデオサイズの問題', {
        ctx: !!ctx,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState
      });
      
      // 次のフレームを試行
      requestAnimationFrame(detectPose);
      return;
    }

    // キャンバスサイズを設定
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // ビデオフレームを描画
    ctx.save();
    ctx.scale(-1, 1); // 鏡像効果
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    // ポーズ検出を実行
    const results = poseLandmarker.detectForVideo(video, performance.now());

    if (results.landmarks && results.landmarks.length > 0) {
      const landmarks = results.landmarks[0];
      
      // 骨格描画も鏡像表示に合わせて左右反転
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      
      // 手動でランドマークを描画
      ctx.fillStyle = '#FF0000';
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;
      
      // ランドマークを点として描画
      landmarks.forEach((landmark) => {
        const x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
      
      // 主要な接続線を描画
      const connections = [
        [11, 12], // 左肩-右肩
        [11, 13], // 左肩-左肘
        [13, 15], // 左肘-左手首
        [12, 14], // 右肩-右肘
        [14, 16], // 右肘-右手首
        [11, 23], // 左肩-左腰
        [12, 24], // 右肩-右腰
        [23, 24], // 左腰-右腰
        [23, 25], // 左腰-左膝
        [25, 27], // 左膝-左足首
        [24, 26], // 右腰-右膝
        [26, 28], // 右膝-右足首
      ];
      
      connections.forEach(([start, end]) => {
        if (landmarks[start] && landmarks[end]) {
          const startX = landmarks[start].x * canvas.width;
          const startY = landmarks[start].y * canvas.height;
          const endX = landmarks[end].x * canvas.width;
          const endY = landmarks[end].y * canvas.height;
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      });
      
      // 骨格描画の変換を元に戻す
      ctx.restore();

      // 肩の座標を取得（左肩: 11, 右肩: 12）
      const leftShoulder = landmarks[11];
      const rightShoulder = landmarks[12];
      const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;

      // 足首の座標を取得（左足首: 27, 右足首: 28）
      const leftAnkle = landmarks[27];
      const rightAnkle = landmarks[28];
      const ankleY = (leftAnkle.y + rightAnkle.y) / 2;

      // 肩と足首の高さの差を計算
      const heightDiff = Math.abs(shoulderY - ankleY);
      const isSameHeight = heightDiff < 0.20;

      // コールバック関数を呼び出し
      if (onPoseDetected) {
        onPoseDetected({
          shoulderY,
          ankleY,
          heightDiff,
          isSameHeight
        });
      }

      // 状態を更新
      if (isSameHeight) {
        setStatus('注意: 肩と足が同じ高さです');
      } else {
        setStatus(`正常 (高さの差: ${heightDiff.toFixed(3)})`);
      }

      // 転倒検出（コメントアウトされていた機能を実装）
      if (prevShoulderYRef.current !== null) {
        const shoulderDiff = shoulderY - prevShoulderYRef.current;
        if (shoulderDiff < -0.15) {
          setStatus('警告: 転倒の可能性があります！');
        }
      }
      prevShoulderYRef.current = shoulderY;
    }

    // 次のフレームをスケジュール
    requestAnimationFrame(detectPose);
  }, [poseLandmarker, onPoseDetected]);

  // 初期化
  useEffect(() => {
    initializePoseLandmarker();
  }, [initializePoseLandmarker]);

  // カメラ開始
  useEffect(() => {
    if (!isLoading && poseLandmarker) {
      startCamera();
    }
  }, [isLoading, poseLandmarker, startCamera]);

  // ポーズ検出開始
  useEffect(() => {
    if (videoRef.current && poseLandmarker) {
      const video = videoRef.current;
      
      const handleLoadedData = () => {
        console.log('ビデオデータ読み込み完了、ポーズ検出開始');
        detectPose();
      };
      
      const handlePlay = () => {
        console.log('ビデオ再生開始');
        detectPose();
      };
      
      // 複数のイベントで検出を開始
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('play', handlePlay);
      video.addEventListener('playing', handlePlay);
      
      // 既に再生中の場合は即座に開始
      if (video.readyState >= 2) {
        console.log('ビデオ既に準備完了、即座に開始');
        detectPose();
      }
      
      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('playing', handlePlay);
      };
    }
  }, [poseLandmarker, detectPose]);

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h3>エラー</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <strong>状態: </strong>
        <span style={{ 
          color: status.includes('警告') ? 'red' : status.includes('注意') ? 'orange' : 'green' 
        }}>
          {status}
        </span>
        <button 
          onClick={() => setShowDebugVideo(!showDebugVideo)}
          style={{ 
            marginLeft: '10px', 
            padding: '5px 10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          {showDebugVideo ? 'デバッグ非表示' : 'デバッグ表示'}
        </button>
      </div>
      
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ 
            display: showDebugVideo ? 'block' : 'none',
            border: '1px solid red',
            marginBottom: showDebugVideo ? '10px' : '0'
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            border: '1px solid #ccc',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
      </div>
      
      {isLoading && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '20px',
          borderRadius: '5px'
        }}>
          読み込み中...
        </div>
      )}
    </div>
  );
};