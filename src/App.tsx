import { useState, useRef } from 'react';
import './App.css'
import { PoseDetector } from './components/PoseDetector';
import { useNavigate } from 'react-router-dom';

interface PoseData {
  shoulderY: number;
  ankleY: number;
  angleDeg?: number;
  isFallenByAngle?: boolean;
}

function App() {
  const [poseData, setPoseData] = useState<PoseData | null>(null);
  const [alertHistory, setAlertHistory] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [isWaitingForRescue, setIsWaitingForRescue] = useState<boolean>(false);
  
  // useRefを使って即座に参照できるようにする
    const isWaitingForRescueRef = useRef<boolean>(false);
    const lastNotificationTimeRef = useRef<number | null>(null);
    const navigate = useNavigate();

  const handlePoseDetected = (data: PoseData) => {
    setPoseData(data);
    if (data.isFallenByAngle) {
      const timestamp = new Date().toLocaleTimeString();
      const alertMessage = `${timestamp}: 転倒検知 (角度: ${data.angleDeg?.toFixed(1)}°)`;
      setAlertHistory(prev => {
        const newHistory = [alertMessage, ...prev].slice(0, 5);
        return newHistory;
      });

      console.log('転倒検知！ userId:', userId, 'isWaitingForRescue(ref):', isWaitingForRescueRef.current);

      // 転倒検知時にAPIへ通知（30分以内の再通知を防ぐ）
      // refを使って即座にチェック
      if (userId && !isWaitingForRescueRef.current) {
        const currentTime = Date.now();
        
        console.log('通知チェック - lastNotificationTime(ref):', lastNotificationTimeRef.current, 'currentTime:', currentTime);
        
        // 最後の通知から30分経過しているかチェック
        if (!lastNotificationTimeRef.current || (currentTime - lastNotificationTimeRef.current) >= 30 * 60 * 1000) {
          console.log('POST送信開始！');
          // 複数回のPOSTを防ぐため、即座に救助待機状態に設定
          isWaitingForRescueRef.current = true;
          lastNotificationTimeRef.current = currentTime;
          setIsWaitingForRescue(true);
          
          fetch('https://mimamoriserver.onrender.com/fall_detected', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: userId
            })
          })
          .then(res => res.json())
          .then(data => {
            console.log('LINE通知結果:', data);
          })
          .catch(err => {
            console.error('LINE通知エラー:', err);
            // エラーが発生した場合は状態をリセット
            isWaitingForRescueRef.current = false;
            lastNotificationTimeRef.current = null;
            setIsWaitingForRescue(false);
          });
        } else {
          console.log('30分経過していないため送信スキップ');
        }
      } else {
        console.log('送信条件を満たさない - userId:', userId, 'isWaitingForRescue(ref):', isWaitingForRescueRef.current);
      }
    }
  };

  // 救助完了ボタンのハンドラー
  const handleRescueComplete = () => {
    isWaitingForRescueRef.current = false;
    lastNotificationTimeRef.current = null;
    setIsWaitingForRescue(false);
  };

  return (
    <div className="app-container">
      <h1 className="app-title">
        MIMAMORI ~命を救う~
      </h1>

      <div className="user-id-card">
        <h3 style={{ marginTop: 0 }}>ユーザーID設定</h3>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="LINE ユーザーIDを入力"
          className="user-id-input"
        />
        {userId && (
          <p className="user-id-display">
            設定中のID: <strong>{userId}</strong>
          </p>
        )}
      </div>

      {isWaitingForRescue && (
        <div className="rescue-alert-card">
          <h3 style={{ marginTop: 0, color: '#d32f2f' }}>⚠️ 救助待機中</h3>
          <p style={{ marginBottom: '15px', fontSize: '14px' }}>
            転倒を検知し、通知を送信しました。<br />
            救助完了後、下のボタンを押してください。
          </p>
          <button
            onClick={handleRescueComplete}
            className="rescue-complete-button"
          >
            救った
          </button>
        </div>
      )}

      <div className="pose-detector-container">
        <div className="video-section">
          <h2>リアルタイム監視</h2>
          <PoseDetector onPoseDetected={handlePoseDetected} />
        </div>

        <div className="info-section">
          <h2>詳細情報</h2>
          {poseData && (
            <div className="status-card">
              <h3>現在の測定値</h3>
              <p><strong>肩の高さ:</strong> {poseData.shoulderY.toFixed(3)}</p>
              <p><strong>足首の高さ:</strong> {poseData.ankleY.toFixed(3)}</p>
              <p><strong>ベクトル角度:</strong> {poseData.angleDeg?.toFixed(1)}°</p>
              <p className={poseData.isFallenByAngle ? 'status-alert' : 'status-normal'}>
                <strong>状態:</strong> {poseData.isFallenByAngle ? '転倒検知' : '正常'}
              </p>
            </div>
          )}

          <div className="alert-card">
            <h3>アラート履歴</h3>
            {alertHistory.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {alertHistory.map((alert, index) => (
                  <li key={index} style={{ marginBottom: '5px', fontSize: '14px' }}>
                    {alert}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic' }}>
                アラートはありません
              </p>
            )}
          </div>

          <div className="info-card">
            <h3>使用方法</h3>
            <ul style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <li>カメラの前に立ち、全身が映るようにしてください</li>
              <li>肩と足首の高さを監視します</li>
              <li>高さの差が0.1以下の場合、警告が表示されます</li>
              <li>転倒や異常な動きを検出すると警告します</li>
            </ul>
          </div>
        </div>
        </div>
      <button className="nav-button" onClick={() => navigate('/')}>サイトへ移動</button>
    </div>
  );
}

export default App
