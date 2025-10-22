
import { useNavigate } from 'react-router-dom';
import "./style.css"
function Intro() {
    const navigate = useNavigate();
    return (
        <div>
            <head>
            </head>
            <body>
                <nav>
                    <ul>
                        <li><a href=""></a></li>
                        <li><a href=""></a></li>
                        <li><a href=""></a></li>
                        <li><a href=""></a></li>
                    </ul>
                </nav>
            <h1>Welcome to MIMAMORI</h1>
            <p>Your safety is our priority. This application monitors your posture and alerts you in case of a fall.</p>
            <button onClick={() => navigate('/app')}>アプリ画面へ移動</button>
            </body>
        </div>
    );
}

export default Intro;