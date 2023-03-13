import React from 'react';
const sha256 = require('js-sha256');

const emptyRes = {
      ContractOwner : '',
      CertificateHash : '',
      Signature : '',
      CertificateOwner : ''
};

const successMsg = {
   text : "Certificate validated succesfully!",
   color : 'green'
};
const failureMsg = {
   text : "Validation failed. Certificate wasn't found in the specified contract.",
   color : 'red'
};

export default function ValidatorPage({
   contractMethods,
   validatorState,
   setValidatorState
}){

	return(
    	<div className = "valid-page">
         <div className = "file-group">
            <label for="validator-img">Select Certificate</label> 
            <div className = "fileName">
               {validatorState.certificate.fileName
               ?validatorState.certificate.fileName
               :'None selected'}
            </div>
            <input 
               type = "file"  
               accept="image/png, image/jpeg"
               id = "validator-img"
               onChange = { (e)=> handleImg(e) }
            /> 
         </div>        
         <input 
            className = "validator-address" 
            type = "text"
            placeholder = "Insert smart contract address"
            onChange = { (e) => setValidatorState({
               ...validatorState,
               contractAddress : e.target.value})
            }
            value = {validatorState.contractAddress}  
         />
         <button className = "valid-btn" onClick = {validate}>Validate</button>
         <div 
            className = "valid-msg" 
            style = {{color : validatorState.validationmsg.color}} 
         >{validatorState.validationmsg.text}
         </div>
         {validatorState.validationResult.ContractOwner&&
            <Result
               {...(validatorState.validationResult)}
            />
         }
      </div>
   )


   function handleImg(e){
      let files = e.target.files
      if (files.length < 1) return;
      let reader = new FileReader();
      let file = files[0];
      reader.onloadend = ()=>{
         setValidatorState({
            ...validatorState,
            certificate : {
               fileName : file.name,
               dataUrl : reader.result
            }
         });
      };
      reader.readAsDataURL(file);
   }

   async function validate(){
      if (!validatorState.certificate.fileName || !validatorState.contractAddress) {
         alert("Please select a Certificate and insert a smart contract address before validating..");
         return;
      }
      try{ 
         let base64_data = validatorState.certificate.dataUrl.split('base64,')[1];
         let hash = sha256(base64_data);
         let signature = await contractMethods.current.getSignedCertificate(validatorState.contractAddress, hash);
         if (!signature){
            setValidatorState({
               ...validatorState,
               validationmsg : failureMsg,
               validationResult : emptyRes
            });
            return;
         }
         let owner = await contractMethods.current.getOwner(validatorState.contractAddress);
         owner = owner.toLowerCase();
         let cert_owner =  await contractMethods.current.ecRecover(hash, signature);
         setValidatorState({
            ...validatorState,
            validationmsg : successMsg,
            validationResult : {
               ContractOwner : owner,
               CertificateHash : hash,
               Signature : signature,
               CertificateOwner : cert_owner
            }
         });
      }
      catch(err){
         setValidatorState({
            ...validatorState,
            validationmsg : failureMsg,
            validationResult : emptyRes
         });
         console.log(err);
      }
   } 
}

function Result({
   ContractOwner,
   CertificateHash,
   Signature,
   CertificateOwner
}){
   return(
      <div  className = "valid-result">
         <b>Contract owner / Certificate issuer</b><br/>
         <div className = "valid-result-field">{ContractOwner}</div>
         <b>Certificate hash</b><br/>
         <div className = "valid-result-field" >{CertificateHash}</div>
         <b>Signature</b><br/>
         <div className = "valid-result-field" >{Signature}</div>
         <b>Certificate owner</b><br/>
         <div className = "valid-result-field" >{CertificateOwner}</div>
      </div>
   )
}