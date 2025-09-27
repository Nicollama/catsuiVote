import React, {useState} from 'react';
import API from '../api';
import { useLocation, useNavigate } from 'react-router-dom';

export default function TOTPSetup(){
  const loc = useLocation();
  const nav = useNavigate();
  const userId = loc.state?.userId;
  const [qr, setQr] = useState(null);

  async function start(){
    const res = await API.post('/auth/totp/setup', { userId });
    setQr(res.data.qrDataUrl);
    // in prototype we also get base32 shown - ignore in prod
  }

  return (
    <div style={{padding:20}}>
      <h3>TOTP Setup</h3>
      {!qr ? <div>
        <p>User ID: {userId}</p>
        <button onClick={start}>Generate TOTP QR</button>
      </div> :
      <div>
        <p>Scan this QR with Google Authenticator or Authy</p>
        <img src={qr} alt="qr"/>
        <p>After scanning, go to Login and include TOTP code.</p>
        <button onClick={()=>nav('/login')}>Go to Login</button>
      </div>}
    </div>
  )
}
