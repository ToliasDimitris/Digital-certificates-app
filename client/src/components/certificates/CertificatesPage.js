import React, {useState, useEffect} from 'react';
import CertificatesPane from './CertificatesPane.js';
import RequestsPane from './RequestsPane.js';

export default function CertificatesPage({
   jwt,
   accounts,
	certificates,
   setCertificates,
	requests,
   setRequests,
   contracts,
   setContracts,
   contractMethods
}){
	
	const [isowned, setIsowned] = useState(true); 

   const selectedContract = contracts.array.length?contracts.array[contracts.index]:"";
   const certIsowned = (cert) => cert.issuedTo === accounts[0];

   useEffect(() => {
      let id = setInterval(fetch_requests, 10000);
      return (()=>{
         clearInterval(id);
      }); 
   },[]);
	
	return(
		<div className = "cert-page">
			<div className = "cert-page-header">              
				<div className = "toggle-owned"
					style = {
                  isowned?
   					{ backgroundColor: 'rgb(255 106 0 / 85%)'}
   					:{backgroundColor: 'rgba(225, 230, 226, 1)'}
					}
					onClick = {()=>{setIsowned(true)} }
			      >Owned
            </div>
				<div className = "toggle-issued"
					onClick = {()=>{setIsowned(false)} }
					style = {
                  isowned?
   					{backgroundColor: 'rgba(225, 230, 226, 1)'}
   					:{backgroundColor: 'rgb(255 106 0 / 85%)'}
					}
			      >Issued
				</div>
			</div>
			<div className = "content">  
				<CertificatesPane 
					certificates = {certificates.filter( cert => certIsowned(cert) === isowned )}
					isowned = {isowned}
               contracts = {contracts}
               setContracts = {setContracts}
               contractMethods = {contractMethods}
               jwt = {jwt}
				/>
				<RequestsPane
               jwt = {jwt}
               selectedContract = {selectedContract}
               certificates = {certificates}
               setCertificates = {setCertificates} 
               accounts = {accounts}        
					requests = {requests}
               setRequests = {setRequests}
					isowned = {isowned}
               contractMethods = {contractMethods}
               contractAddress = {selectedContract}
				/>
			</div> 
		</div>
	)


   async function fetch_requests(){
      try{
         let resp = await fetch('http://localhost:3100/user/fetch_requests', {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body : JSON.stringify({ jwt : jwt.current})
         });
         if (!resp.ok) throw new Error("Error fetching requests");
         let json = await resp.json();
         if (!json.success) throw new Error("Error fetching requests");
         let fetched_requests = json.data.requests;
         if (fetched_requests.length > 0){
            setRequests([...requests, ...fetched_requests]);
         }
      }
      catch(err){
         console.log(err);
      }
   }
}
