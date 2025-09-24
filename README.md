# MIMAMORI ~命を救う~

## 概要
MIMAMORIは、リアルタイムで人の姿勢を検知し、肩と足の高さが同じになった場合にアラートを表示するWebアプリです。転倒や倒れ込みなどの危険を素早く検知し、命を守ることを目的としています。

## 主な機能
- Mediapipe PoseLandmarkerによる姿勢検知
- 肩と足の高さの差分計算
- 危険検知時のアラート履歴表示（最新5件）
- リアルタイム映像の表示

## 技術スタック
- React 19
- TypeScript
- Vite
- Mediapipe Tasks Vision

## セットアップ方法

1. リポジトリをクローン
	```bash
	git clone https://github.com/Rawahu0731/MIMAMORI.git
	cd MIMAMORI
	```

2. 依存パッケージのインストール
	```bash
	npm install
	```

3. 開発サーバーの起動
	```bash
	npm run dev
	```

4. ブラウザで `http://localhost:5173` にアクセス

## ファイル構成
- `src/App.tsx` : メイン画面・アラート履歴管理
- `src/components/PoseDetector.tsx` : 姿勢検知コンポーネント
- `public/` : 公開用静的ファイル
- `index.html` : エントリーポイント

## ライセンス
MIT