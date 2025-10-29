import { useNavigate } from 'react-router-dom';
import "./style.css"
function Intro() {
    const navigate = useNavigate();
    return (
        <div>
            <nav className="Intro-nav">
                <ul className="Intro-ul">
                    <li><a href="#how-to-use">使用方法</a></li>
                    <li><a href="#assumed-scene">想定されるシーン</a></li>
                    <li><a href="#question">よくある質問</a></li>
                </ul>
            </nav>
            <h1>MIMAMORI~命を救う~</h1>
            <div className="Intro">
            <h2>このアプリの仕様</h2>
            <section id="how-to-use">
            <h3>使用方法</h3>
            <ol>
                <li>このシステムは、あなたの肩と足首の高さをチェックしています。</li>
                <li>両方の高さの差が0.1以下になると、警告が表示されます。</li>
                <li>また、転倒や不自然な動きを検出した場合にも警告を出します。</li>
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
                など、様々なシーンでの利用を想定しています。

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
            </div>
            <button className='glow-button' onClick={() => navigate('/app')}>アプリ画面へ移動</button>
        </div>
    );
}

export default Intro;
