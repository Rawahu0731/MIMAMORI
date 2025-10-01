import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface PoseDetectorProps {
  onPoseDetected?: (poseData: {
    shoulderY: number;
    ankleY: number;
    angleDeg?: number;
    isFallenByAngle?: boolean;
  }) => void;
}

export const PoseDetector: React.FC<PoseDetectorProps> = ({ onPoseDetected }) => {
  const [showDebugLog, setShowDebugLog] = useState(true);
  // デバッグログ管理
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const addDebugLog = useCallback((msg: string) => {
    setDebugLogs(logs => {
      const newLogs = [...logs, msg];
      return newLogs.length > 10 ? newLogs.slice(-10) : newLogs;
    });
    console.log(msg);
  }, []);
  // カメラデバイスIDを管理
  const [cameraDeviceId, setCameraDeviceId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('初期化中...');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
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

  useEffect(() => {
    const updateCameraDevice = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      addDebugLog('カメラデバイス一覧: ' + videoDevices.map(d => `[${d.label}] id=${d.deviceId}`).join(', '));
      let selectedDeviceId: string | null = null;
      if (facingMode === 'environment') {
        // 外カメラっぽいデバイスを優先
        const backCam = videoDevices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'));
        selectedDeviceId = backCam ? backCam.deviceId : videoDevices.length > 1 ? videoDevices[1].deviceId : videoDevices[0]?.deviceId ?? null;
      } else {
        // 内カメラ
        const frontCam = videoDevices.find(d => d.label.toLowerCase().includes('front'));
        selectedDeviceId = frontCam ? frontCam.deviceId : videoDevices[0]?.deviceId ?? null;
      }
      addDebugLog(`選択されたdeviceId: ${selectedDeviceId}`);
      setCameraDeviceId(selectedDeviceId);
    };
    updateCameraDevice().then(() => {
      if (!isLoading && poseLandmarker) {
        startCamera();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, poseLandmarker, facingMode]);

  // Webカメラを開始
  const startCamera = useCallback(async () => {
    addDebugLog(`startCamera: facingMode = ${facingMode}, deviceId = ${cameraDeviceId}`);
    try {
      // 既存ストリームがあれば停止
      if (videoRef.current && videoRef.current.srcObject) {
        const oldStream = videoRef.current.srcObject as MediaStream;
        oldStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      let constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };
      // deviceId優先、なければfacingModeのみ
      if (cameraDeviceId) {
        (constraints.video as any).deviceId = { exact: cameraDeviceId };
      } else {
        (constraints.video as any).facingMode = facingMode;
        addDebugLog('deviceIdがnullなのでfacingModeのみでカメラ取得');
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      addDebugLog('カメラストリーム取得成功');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        addDebugLog('ビデオ要素にストリームを設定');
        videoRef.current.onloadedmetadata = () => {
          addDebugLog('ビデオメタデータ読み込み完了');
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              addDebugLog('ビデオ再生開始');
              setStatus('カメラ準備完了');
            }).catch(playErr => {
              addDebugLog('ビデオ再生エラー: ' + playErr);
              setError('ビデオの再生に失敗しました');
            });
          }
        };
      }
    } catch (err) {
      addDebugLog('カメラアクセスエラー: ' + err);
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      setError(`カメラにアクセスできませんでした: ${errorMessage}`);
    }
  }, [facingMode, cameraDeviceId, addDebugLog]);

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
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // ポーズ検出を実行
    const results = poseLandmarker.detectForVideo(video, performance.now());

    if (results.landmarks && results.landmarks.length > 0) {
      const landmarks = results.landmarks[0];
      
      // 骨格描画も鏡像表示に合わせて左右反転
  ctx.save();
      
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

      // 体軸ベクトル（肩-腰）で傾きを判定
      const leftHip = landmarks[23];
      const rightHip = landmarks[24];
      // 肩の中心と腰の中心
      const centerShoulder = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2
      };
      const centerHip = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2
      };
      // ベクトル
    const dx = centerHip.x - centerShoulder.x;
    const dy = centerHip.y - centerShoulder.y;
    // Y軸とのなす角度（立ち姿勢: 0度、寝姿勢: 90度）
    const vecLength = Math.sqrt(dx * dx + dy * dy);
    const cosTheta = Math.abs(dy) / (vecLength || 1e-6); // 0除算防止
    const angleRad = Math.acos(cosTheta);
    const angleDeg = angleRad * 180 / Math.PI;
    // 60度以上なら倒れていると判定（しきい値は調整可能）
      // 補助判定: 肩～足首のY座標差が小さい場合も転倒とみなす
      const shoulderAnkleYDiff = Math.abs(shoulderY - ankleY);
      const isFallenByHeight = shoulderAnkleYDiff < 0.15; // しきい値は調整可能
      const isFallenByAngle = angleDeg > 60 || isFallenByHeight;
      addDebugLog(`detectPose: angleDeg = ${angleDeg}, isFallenByAngle = ${isFallenByAngle}, shoulderAnkleYDiff = ${shoulderAnkleYDiff}`);

      // コールバック関数を呼び出し
      if (onPoseDetected) {
        onPoseDetected({
          shoulderY,
          ankleY,
          angleDeg,
          isFallenByAngle
        });
      }

      // 状態を更新
      if (isFallenByAngle) {
        setStatus(`警告: 体が横向きに倒れています (角度: ${angleDeg.toFixed(1)}°)`);
      } else {
        setStatus(`正常 (角度: ${angleDeg.toFixed(1)}°)`);
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
    // カメラデバイス一覧取得
    const updateCameraDevice = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      addDebugLog('カメラデバイス一覧: ' + videoDevices.map(d => `[${d.label}] id=${d.deviceId}`).join(', '));
      let selectedDeviceId: string | null = null;
      if (facingMode === 'environment') {
        // 外カメラっぽいデバイスを優先
        const backCam = videoDevices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'));
        selectedDeviceId = backCam ? backCam.deviceId : videoDevices.length > 1 ? videoDevices[1].deviceId : videoDevices[0]?.deviceId ?? null;
      } else {
        // 内カメラ
        const frontCam = videoDevices.find(d => d.label.toLowerCase().includes('front'));
        selectedDeviceId = frontCam ? frontCam.deviceId : videoDevices[0]?.deviceId ?? null;
      }
      addDebugLog(`選択されたdeviceId: ${selectedDeviceId}`);
      setCameraDeviceId(selectedDeviceId);
    };
    updateCameraDevice().then(() => {
      if (!isLoading && poseLandmarker) {
        startCamera();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, poseLandmarker, facingMode]);

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
      <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => setShowDebugLog(v => !v)}
          style={{
            marginLeft: '10px',
            padding: '5px 10px',
            backgroundColor: showDebugLog ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          {showDebugLog ? 'ログ非表示' : 'ログ表示'}
        </button>
        <strong>状態: </strong>
        <span style={{ 
          color: status.includes('警告') ? 'red' : status.includes('注意') ? 'orange' : 'green',
          marginRight: '16px'
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
        <button
          onClick={() => setFacingMode(facingMode === 'user' ? 'environment' : 'user')}
          style={{
            marginLeft: '10px',
            padding: '5px 10px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          カメラを切り替える
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
      {/* デバッグログ表示領域 */}
      {showDebugLog && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          maxHeight: '30vh',
          overflowY: 'auto',
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          fontSize: '12px',
          zIndex: 9999,
          padding: '8px',
          boxSizing: 'border-box'
        }}>
          <div>デバッグログ</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {debugLogs.map((log, i) => (
              <li key={i} style={{ whiteSpace: 'pre-wrap' }}>{log}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};