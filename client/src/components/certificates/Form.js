import React, {useState, useRef} from 'react';
import {unstable_batchedUpdates} from 'react-dom';
import RequestObj from '../../model/RequestObj.js';
import CertificateObj from '../../model/CertificateObj.js';
const sha256 = require('js-sha256');


export default function Form({
   jwt,
   accounts,
   requests,
   setRequests
}){

   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');
   const [address, setAddress] = useState('');   
   const [imgDataUrl, setImgDataUrl] = useState('');
   const [disabled, setDisabled] = useState(false);
   const formRef = useRef();
   
   return(
      <div className = "form" id = "form" >
         <span 
            className = "close"
            onClick = {()=>{
               init();
               document.getElementById("form").style.display = "none";}
            }
            >&times;
         </span>
         <form ref = {formRef} >
            <fieldset disabled = {disabled?'disabled':''}>
               <h2>Issue Certificate</h2>
               <br/> 
               <br/> 
               <label for="address">Recipient ethereum address</label>
               <br/>
               <input 
                  type="text" 
                  id="address" 
                  name="address"
                  onChange = {(e)=> setAddress(e.target.value)}
               />
               <br/>
               <br/>
               <br/>        
               <label for="issue-form-cert">Certificate image</label>
               <br/>
               <input 
                  type = "file"  
                  accept="image/png, image/jpeg" 
                  id="issue-form-cert"
                  onChange = {(e)=> handleImg(e.target.files)}
               />
               <button onClick = {onSubmit}>Submit</button>
               <br/>
               <br/>
               <br/>
               <div 
                  className = "error" 
                  id = "error"
                  style ={ {display: error?'block':'none'} }
               >
                  {error}               
               </div>
               <div 
                  className = "success" 
                  id = "success"
                  style ={ {display: success?'block':'none'} }
               >
                  {success}               
               </div>
            </fieldset> 
         </form>
      </div>
   )

   async function onSubmit(e){
      e.preventDefault();     
      setDisabled(true);

      let base64_data = imgDataUrl.split('base64,')[1];
      let certificate = new CertificateObj({
         issuedAt : Date.now(),
         issuedBy : accounts[0],
         issuedTo : address,
         imgDataUrl : imgDataUrl,
         hash : sha256(base64_data)
      });
      let obj = {
         type : 'ISS',
         jwt : jwt.current,
         data : {
            cert : certificate
         }
      };
      let json = await upd_requests(obj);
      //if our request was successful
      if (json.success){
         certificate.id = json.data.cert_id;
         let req_id = json.data.req_id;
         let request = new RequestObj({
            id : req_id,
            certificate : certificate,
            type : 'ISS',
         });
         //add new request to requests array 
         setRequests( [...requests, request]);
         setSuccess("Certificate sent for signature!");
      }
      //if failed set error 
      else{
         setError(json.error);
      }
   }


   function handleImg(files){
      if (files.length < 1) return;
      let reader = new FileReader();
      let file = files[0];
      reader.onloadend = ()=>{
         setImgDataUrl(reader.result);
      };
      reader.readAsDataURL(file);
   }

   function init(){       
      unstable_batchedUpdates( () => {
         setError('');
         setSuccess('');
         setDisabled(false);
         setImgDataUrl('');
         setAddress(''); 
         formRef.current.reset();             
      });
   }


}


async function upd_requests(obj){
   try{
      let resp = await fetch('http://localhost:3100/user/upd_requests', {
         method : 'POST',
         headers: { 'Content-Type': 'application/json' },
         body : JSON.stringify(obj)
      });
      if (!resp.ok) return ({ success : false, error : "Posting certificate failed" });
      let json = await resp.json();
      return json;
   }
   catch(err){
      return ({ success : false, error : err.message });
   }
}
