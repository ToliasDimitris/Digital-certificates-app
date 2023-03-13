import React ,{useState, useEffect, useRef} from 'react';
import MetaMaskOnboarding from '@metamask/onboarding';
import {unstable_batchedUpdates} from 'react-dom';
import create_contract from '../../contract/DigitalCertificatesContract.js';

const INSTALL_TEXT = 'Install MetaMask!';
const LOGIN_TEXT = 'Login';

export default function LoginBtn({	
	setAccounts,
   setCertificates,
   setRequests,
   setContracts,
   setUser,
	jwt,
   contractMethods
}){
	const [text, setText] = useState(INSTALL_TEXT);
	const [error, setError] = useState('');
	const onboarding = useRef();	

	useEffect(() =>{
		if (!onboarding.current){
			onboarding.current = new MetaMaskOnboarding();
		}
      if (MetaMaskOnboarding.isMetaMaskInstalled()){      
         setText(LOGIN_TEXT);
         onboarding.current.stopOnboarding();
      }	
	}, []);


	const onClick = async () => {  
		if (text === INSTALL_TEXT){
			onboarding.current.startOnboarding();
		}
		else if (text === LOGIN_TEXT){
			try{
				let data = {};
				data.acc = await window.ethereum.request({ method : 'eth_requestAccounts' });

				//-----------------GET NONCE----------------------------
				data.sign_msg = await fetchNonce(data.acc[0]);
				data.nonce = data.sign_msg.slice(26);
				
            //--------------SIGN MESSAGE----------------------------				
				data.signature = await signMessage(data.acc[0],data.sign_msg);
				
            //--------------------GET JWT----------------------------				
				data.jwt = await fetchToken(data.acc[0], data.signature, data.sign_msg);
            //also get certificates and requests, responses to set for the APP
            let {certificates, requests, contracts, user} = await fetchUserData(data.jwt);
				//------------------------------------------------------            
				//set data for APP
            unstable_batchedUpdates( () => {
               contractMethods.current = create_contract(data.acc[0], window.ethereum);
               jwt.current = data.jwt;
               setAccounts(data.acc);
               setCertificates(certificates);
               setRequests(requests);
               setContracts({ array: contracts, index : 0 });
               setUser(user);
            });
			}
			catch(err){
				setError(err.message);
			}
		}
	}


	return(
		<>
   		<button className = "login-btn" onClick = {onClick}>{text}</button>
   		<br/>
   		<p className = "error-msg">{error}</p>
		</>
	);

}

function signMessage(publicAddress, msg) {   
   let hex_msg = `0x${Buffer.from(msg, 'utf8').toString('hex')}`;
	return (
		window.ethereum.request({
					method : 'personal_sign',
					params: [hex_msg, publicAddress]
				})
	)
				
}

async function fetchNonce(publicAddress){   
   let resp = await fetch('http://localhost:3100/'+publicAddress+'/nonce');
   if (!resp.ok) throw new Error("FETCHING NONCE FAILED");
   let json = await resp.json();
   return json.sign_msg;   
}

async function fetchToken(publicAddress, signature, sign_msg){
	let resp = await fetch('http://localhost:3100/'+publicAddress+'/signature', {
		method : 'POST',
		headers: { 'Content-Type': 'application/json' },
		body : JSON.stringify({
			signature : signature,
			sign_msg : sign_msg
		})
	});
	if (!resp.ok) throw new Error("FETCHING JWT FAILED");
	let json = await resp.json();
	return json.jwt;
}

async function fetchUserData(jwt){
   let resp = await fetch('http://localhost:3100/user/fetch_userdata', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body : JSON.stringify({
         jwt : jwt
      })
   });
   if (!resp.ok) throw new Error("FETCHING USER DATA FAILED");
   let json = await resp.json();
   if (!json.success) throw new Error("FETCHING USER DATA FAILED");
   return json.data;   
}


