
import { useNavigate } from 'react-router-dom';

function Intro() {
    const navigate = useNavigate();
    return (
        <div>
            <h1>Welcome to MIMAMORI</h1>
            <p>Your safety is our priority. This application monitors your posture and alerts you in case of a fall.</p>
            <button onClick={() => navigate('/app')}>アプリ画面へ移動</button>
        </div>
    );
}

export default Intro;