import React, {useState, useEffect} from 'react';


export default function Request({
   jwt,
   accounts,
   request,
   requests,
   setRequests,
   certificates,
   setCertificates,
   contractAddress,
   contractMethods
}){

   const [error, setError] = useState('');
   const array = getContent();
  
   useEffect(()=>{             
         modal_img('req'+request.id, request.certificate.imgDataUrl);
         
   },[])


   return (
      <div className ="req">
         <div className ="request-text">
            {array[0]}
         </div>         
         <div className="btn-wrapper">  
            {array[1]}
         </div>
         <div className = "error">
            {error}
         </div>
      </div>
   )   	
	
   function getContent(){
      let type = request.type;
      let tome = toMe(request);
      switch(true){
         case(type === 'ISS' && tome === true) :
            return([
               (<>A <a id={'req'+request.id}>Certificate</a>  was issued for you, sign it if you agree with it.</>),
               (<>
                  <button onClick = {onSign} className ="request-btn">Sign</button>
                  <button onClick = {onReject} className ="request-btn">Reject</button>
               </>)
            ]);

         case(type === 'ISS' && tome === false) :
            return([
               (<> <a id={'req'+request.id}>Certificate</a> sent to user to be signed.</>),
               (<></>)
            ]);
            
         case(type === 'ISS_SIGNED' && tome === true) :
            return([
               (<> <a id={'req'+request.id}>Certificate</a> signed! You will get notified when issuer uploads it to blockchain.</>),
               (<></>)
            ]);

         case(type === 'ISS_SIGNED' && tome === false) :
            return([
               (<> <a id={'req'+request.id}>Certificate</a> signed! Upload it to blockchain.</>),
               (<>
                  <button onClick = {onUpload} className ="request-btn">Upload</button>
               </>)
            ]);      


         case(type === 'ISS_UPL' && tome === true) :
         case(type === 'ISS_UPL' && tome === false) :
            return([
               (<> <a id={'req'+request.id}>Certificate</a> uploaded successfully!</>),
               (<>
                  <button onClick = {onSave} className ="request-btn">Save</button>
               </>)
            ]);
         
         case(type === 'ISS_UPLFL' && tome === true) :
         case(type === 'ISS_UPLFL' && tome === false) :                  
            return([
               (<> <a id={'req'+request.id}>Certificate</a> failed to upload...</>),
               (<>
                  <button onClick = {onOk} className ="request-btn">Ok</button>
               </>)
            ]);
            
         case(type === 'ISS_DECL' && tome === true) :
            return([
               (<> <a id={'req'+request.id}>Certificate</a> rejected.</>),
               (<>
                  <button onClick = {onOk} className ="request-btn">Ok</button>
               </>)
            ]);

         case(type === 'ISS_DECL' && tome === false) :
            return([
               (<>User rejected <a id={'req'+request.id}>Certificate</a>.</>),
               (<>
                  <button onClick = {onOk} className ="request-btn">Ok</button>
               </>)
            ]);
      }
   }

   function toMe(req){
      return (accounts[0] == req.certificate.issuedTo);
   } 


   //below i ll declare all handlers for buttons
   //after a button is pressed we ll hit api (sometimes blockchain too) 
   //get result and update our requests

   async function onSign(){
      try{   
         let certificate = request.certificate;
         let hash = certificate.hash;
         let signature = await signMessage(accounts[0], hash);
         let obj = {
            type : 'ISS_SIGNED',
            jwt : jwt.current,
            data : {
               cert : certificate,
               signature : signature,
               req_id : request.id
            }
         };
         let json = await upd_requests(obj);
         if (!json.success) throw new Error("Signing of certificate failed");
         //success!
         let new_req = {
            ...request,
            type : 'ISS_SIGNED',
            certificate : {
               ...certificate,
               signature : signature
            }
         };
         replace_request(new_req);
      }
      catch(err){
         setError(err.message)
      }

   }

   async function onReject(){
      try{   
         let certificate = request.certificate;
         let obj = {
            type : 'ISS_DECL',
            jwt : jwt.current,
            data : {
               cert : certificate,
               req_id : request.id
            }
         }
         let json = await upd_requests(obj);
         if (!json.success) throw new Error("Rejecting of certificate failed");
         //success
         let new_req = {
            ...request,
            type : 'ISS_DECL'         
         }
         replace_request(new_req);
      }
      catch(err){
         setError(err.message);
      }
   }

   async function onUpload(){
      try{
         if (!contractAddress) throw new Error("No contract available, create one before you try to upload Certificate!");
         let certificate = request.certificate;
         // upload must return empty string if upload fails --> so we can handle it
         let receipt = await upload(certificate, contractAddress);
         let obj = {
            jwt : jwt.current,
            data : {
               cert : certificate,
               req_id : request.id
            }
         }
         let new_req;
         if (receipt){
            obj.type = 'ISS_UPL';
            obj.data.contractAddress = contractAddress;
            new_req = {
               ...request,
               type : 'ISS_UPL',
               certificate : {
                  ...certificate,
                  contractAddress : contractAddress
               }
            }
         }
         else{
            obj.type = 'ISS_UPLFL';
            new_req = {
               ...request,
               type : 'ISS_UPLFL'
            }
         }       
         let json = await upd_requests(obj);
         if (!json.success) throw new Error("Upload failed!");         
         replace_request(new_req);
      }
      catch(err){
         setError(err.message);
      }

   }

   // we have successfull upload, save certificate if not exists and delete request
   async function onSave(){
      try{
         let obj = {
            type : 'ISS_CLOSED',
            jwt : jwt.current,
            data : {
               cert: request.certificate,
               req_id : request.id
            }
         }
         let json = await upd_requests(obj);
         if (!json.success) throw new Error("Failed to save certificate");
         setRequests(requests.filter(req => req.id != request.id));
         if (!certificates.find( cert => cert.id === request.certificate.id )){
            setCertificates([...certificates, request.certificate]);
         }
      }
      catch(err){
         setError(err.message);
      }

   }
   //will be used when upload fails or when signature is rejected
   //. We click ok and request is deleted
   async function onOk(){
      try{
         let obj = {
            type : 'ISS_FL',
            jwt : jwt.current,
            data : {
               cert : request.certificate,
               req_id : request.id
            }
         }
         let json = await upd_requests(obj);
         if (!json.success) throw new Error("Failed to delete request");
         setRequests( requests.filter( req => req.id != request.id ));
      }
      catch(err){
         setError(err.message);
      }

   }

   function replace_request(new_req){
      setRequests( requests.map( (request)=>{
         if (request.id === new_req.id){
            return new_req;
         }
         return request;
      }));
   }

   //Uploads certificate to blockchain, if upload fails return empty string else return receipt string
   async function upload(certificate, contractAddress){
      try{
         let receipt = await contractMethods.current.addCertificate(
            contractAddress,
            certificate.hash,
            certificate.signature
         );
         return JSON.stringify(receipt);
      }
      catch(err){
         console.log(err);
         return '';
      }
   }
 
}

//------------------UTILITY FUNCTIONS-----------------------------------

//takes the element with the specified id and makes it so 
//when its clicked the img with src given is presented at modal window
function modal_img(id, src){
   let modal = document.getElementById("modal");
   let image = document.getElementById("modal-img");
   let element = document.getElementById(id);
   element.onclick = ()=>{
      modal.style.display = "block";
      image.src = src;
   }
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

async function upd_requests(obj){
   try{
      let resp = await fetch('http://localhost:3100/user/upd_requests', {
         method : 'POST',
         headers: { 'Content-Type': 'application/json' },
         body : JSON.stringify(obj)
      });
      if (!resp.ok) return ({ success : false, error : "Request failed!" });
      let json = await resp.json();
      return json;
   }
   catch(err){
      return ({ success : false, error : err.message });
   }
}

