import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import "./style.css"
function Intro() {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <div>
            <nav className="Intro-nav">
                <button 
                    className="hamburger-button" 
                    onClick={toggleMenu}
                    aria-label="メニュー"
                >
                    <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
                    <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
                    <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
                </button>
                <ul className={`Intro-ul ${isMenuOpen ? 'menu-open' : ''}`}>
                    <li><a href="#overview" onClick={closeMenu}>アプリ概要</a></li>
                    <li><a href="#how-to-use" onClick={closeMenu}>使用方法</a></li>
                    <li><a href="#assumed-scene" onClick={closeMenu}>想定されるシーン</a></li>
                    <li><a href="#question" onClick={closeMenu}>よくある質問</a></li>
                    <li><a href="#device" onClick={closeMenu}>対応デバイス・動作環境</a></li>
                    <li><a href="#privacy" onClick={closeMenu}>プライバシーについて</a></li>
                    <li><a href="#Precautions" onClick={closeMenu}>注意事項</a></li>
                </ul>
            </nav>
            <h1>MIMAMORI~命を救う~</h1>
            <div className="Intro">
            <h2>このアプリの仕様</h2>
            <section id="overview">
            <h3>アプリ概要</h3>
            <p>
                このシステムは、カメラであなたの肩と足首の高さをチェックし、
                転倒や不自然な動きを検出した場合に警告を表示する安全サポートアプリです。
                家庭内での見守りや安全確認に役立ちます。
            </p>
            </section>
            <section id="how-to-use">
            <h3>使用方法</h3>
            <ol>
                <li>カメラ付きデバイス（PC・スマートフォン・タブレットなど）でアプリを起動します。</li>
                <li>カメラを、監視したい人が映る位置に設置してください。</li>
                <li>システムが肩と足首の高さを自動的に検出します。</li>
                <li>両方の高さの差が0.1以下になると、転倒の可能性として警告が表示されます。</li>
                <li>また、急な姿勢の変化など不自然な動きを検出した場合も警告を出します。</li>
                <li>警告が出ると設定したLINEにも通知がいきます。</li>
            </ol>
            </section>
            <section id="assumed-scene">
            <h3>想定されるシーン</h3>
            <p>
                <ol>
                    <li>家で遊んでるときに子供が転んでしまった時</li>
                    <li>高齢者の方が家で転倒してしまった時</li>
                    <li>一人暮らしの方が倒れてしまった時</li>
                </ol>
                など、家庭・介護・見守りなど幅広いシーンで活用できます。
            </p>
            </section>
            <section id="question">
            <h3>よくある質問</h3>
            <p>Q:誤検知はありますか？<br></br>
               A:はい、環境や動きによっては誤検知が発生することがあります。<br></br>
               <br></br>
               Q:カメラの位置はどこが良いですか？<br></br>
               A:監視する人を二方向から映るように二台のカメラを設置することをお勧めします。<br></br>
               <br></br>
               Q:アプリは無料ですか？<br></br>
               A:はい、全ての機能が無料でご利用いただけます。 <br></br>
            </p>
            </section>
            <section id="device">
            <h3>対応デバイス・動作環境</h3>
            <p>
                Webカメラ対応のPC<br></br>
                カメラ付きスマートフォン・タブレット<br></br>    
                安定したインターネット接続環境を推奨
            </p>
            </section>
            <section id="privacy">
                <h3>プライバシーについて</h3>
                <p>
                    映像データは端末内で処理され、外部には送信されません。<br></br>
                    個人情報は一切収集しません。<br></br>
                    セキュリティとプライバシーを最優先に設計されています。<br></br>
                </p>
            </section>
            <section id="Precautions">
                <h3>注意事項</h3>
                <p>
                    暗い場所やカメラに障害物がある場合、検出精度が低下します。<br></br>
                    被写体がフレームから外れると正しく検知できません。<br></br>
                    本アプリは医療機器ではなく、補助的な見守りツールです。
                </p>
            </section>
            </div>
            <button className='glow-button' onClick={() => navigate('/app')}>アプリ画面へ移動</button>
            <p className='logo'>「人を守るAIが、そばにいる。」</p>
        </div>
    );
}

export default Intro;
