import { useState } from 'react';
import './App.css'
import { PoseDetector } from './components/PoseDetector';

interface PoseData {
  shoulderY: number;
  ankleY: number;
  angleDeg?: number;
  isFallenByAngle?: boolean;
}

function App() {
  const [poseData, setPoseData] = useState<PoseData | null>(null);
  const [alertHistory, setAlertHistory] = useState<string[]>([]);

  const handlePoseDetected = (data: PoseData) => {
    setPoseData(data);
    if (data.isFallenByAngle) {
      const timestamp = new Date().toLocaleTimeString();
      const alertMessage = `${timestamp}: 転倒検知 (角度: ${data.angleDeg?.toFixed(1)}°)`;
      setAlertHistory(prev => {
        const newHistory = [alertMessage, ...prev].slice(0, 5);
        return newHistory;
      });

      // 転倒検知時にAPIへ通知
      fetch('https://mimamoriserver.onrender.com/fall_detected', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: 'Uf23ce792b22fc4f6f9799d85e05cb96a'//テスト用ユーザーID
        })
      })
        .then(res => res.json())
        .then(data => {
          // 必要ならレスポンスを処理
          console.log('LINE通知結果:', data);
        })
        .catch(err => {
          console.error('LINE通知エラー:', err);
        });
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333', textAlign: 'center', marginBottom: '30px' }}>
        MIMAMORI ~命を救う~
      </h1>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '400px' }}>
          <h2>リアルタイム監視</h2>
          <PoseDetector onPoseDetected={handlePoseDetected} />
        </div>

        <div style={{ flex: '0 0 300px' }}>
          <h2>詳細情報</h2>
          {poseData && (
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h3>現在の測定値</h3>
              <p><strong>肩の高さ:</strong> {poseData.shoulderY.toFixed(3)}</p>
              <p><strong>足首の高さ:</strong> {poseData.ankleY.toFixed(3)}</p>
              <p><strong>ベクトル角度:</strong> {poseData.angleDeg?.toFixed(1)}°</p>
              <p style={{
                color: poseData.isFallenByAngle ? '#d32f2f' : '#2e7d32',
                fontWeight: 'bold'
              }}>
                <strong>状態:</strong> {poseData.isFallenByAngle ? '転倒検知' : '正常'}
              </p>
            </div>
          )}

          <div style={{
            backgroundColor: '#fff3e0',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #ffb74d'
          }}>
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

          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px'
          }}>
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
    </div>
  );
}

export default App
