import React from 'react';
import Request from './Request.js';


export default function RequestsPane({
   jwt,
   accounts,
   requests,
   setRequests,
   certificates,
   setCertificates,
   contractAddress,
   isowned,
   contractMethods
}){
  
  
  const req_isowned = (req) => req.certificate.issuedTo === accounts[0];

	return(
    	<div className = "req-pane">        
         {requests
         .filter( req => req_isowned(req) === isowned )
         .map((request)=>(
            <Request
               key = {request.id}
               jwt = {jwt}
               contractAddress = {contractAddress}
               certificates = {certificates}
               setCertificates = {setCertificates}
               requests = {requests}
               setRequests = {setRequests}
               accounts = {accounts}
               request = {request}
               contractMethods = {contractMethods}
            />
         ))}        
    	</div>
   ) 
}