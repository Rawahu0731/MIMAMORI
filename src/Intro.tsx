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
                <li>カメラの前に立ち、全身が映るようにしてください</li>
                <li>肩と足首の高さを監視します</li>
                <li>高さの差が0.1以下の場合、警告が表示されます</li>
                <li>転倒や異常な動きを検出すると警告します</li>
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
               A:はい、環境や動きによっては誤検知が発生することがあります。
            </p>
            </section>
            </div>
            <button onClick={() => navigate('/app')}>アプリ画面へ移動</button>
        </div>
    );
}

export default Intro;
