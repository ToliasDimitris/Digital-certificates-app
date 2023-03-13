import React, {useState, useRef, useEffect} from 'react';
import './App.css';
import {unstable_batchedUpdates} from 'react-dom';
import LoginPage from './components/login/LoginPage.js';
import Header from './components/Header.js';
import CertificatesPage from './components/certificates/CertificatesPage.js';
import ValidatorPage from './components/validator/ValidatorPage.js';
import Form from './components/certificates/Form.js';

const empty_validatorState = {
   contractAddress : '',
   certificate : {fileName : '', dataUrl : ''},
   validationmsg : {text : '', color : ''},
   validationResult : {
      ContractOwner : '',
      CertificateHash : '',
      Signature : '',
      CertificateOwner : ''
   }
}

export default function App(){
   
  const [accounts, setAccounts] = useState([]);
  const jwt = useRef();
  const contractMethods = useRef();
  const [contracts, setContracts] = useState({ array: [], index : 0 });
  const [user, setUser] = useState({});
  const [isvalidator, setIsvalidator] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [requests, setRequests] = useState([]);
  const [validatorState, setValidatorState] = useState(empty_validatorState);  

  const loggedin = () =>{
    return accounts.length>0;
  }

  
  if (!loggedin()){
    return(
      <div className="App" id = "App">      	
        	<LoginPage         
            setCertificates = {setCertificates}
            setRequests = {setRequests}
            setContracts = {setContracts}
            setUser = {setUser}
          	setAccounts = {setAccounts}
            jwt = {jwt} 
            contractMethods = {contractMethods}
          />        
      </div>  
    )
  }
  else{
    return(
      <div className="App"  id = "App">
         <Header 
            setIsvalidator = {setIsvalidator}
            init = {init}
         />
         {isvalidator?
         <ValidatorPage
            contractMethods = {contractMethods}
            validatorState = {validatorState}
            setValidatorState = {setValidatorState}
         />
         :<CertificatesPage 
            jwt = {jwt}
            contracts = {contracts}
            setContracts = {setContracts}
            accounts = {accounts}
            certificates = {certificates}
            setCertificates = {setCertificates}
            requests = {requests}
            setRequests = {setRequests}
            contractMethods = {contractMethods}
         />
         }
         <div className = "modal" id = "modal">
            <span className = "close"
                  onClick = {()=>{document.getElementById("modal").style.display = "none";}}
               >&times;
            </span>
            <img className = "modal-img" id = "modal-img"/>
            <div className = "moda-div" id = "modal-div">
            </div>
         </div>
         <Form 
            jwt = {jwt}
            accounts = {accounts}
            requests = {requests}
            setRequests = {setRequests}
         />
      </div>
    )
  }
  	
  	//initiallize all data of the App, used at logout
	function init(){
		console.log("initializing APP");
		unstable_batchedUpdates( () => {
			setAccounts([]);
         jwt.current = null;
         contractMethods.current = null;  
         setContracts({ array: [], index : 0 });
         setUser({});
			setIsvalidator(false);
         setCertificates([]);
         setRequests([]);	
         setValidatorState(empty_validatorState)		 
		});
	}

}
