import React from 'react';

export default function Certificate({
  certificate,
  isowned
}){    

	return(  
      <div className="cert" id = {'cert'+certificate.id}>
         <input type="checkbox" id={'pic'+certificate.id}/>
         <label for={"pic"+certificate.id}>
            <img  src = {certificate.imgDataUrl}/>
         </label>
         <div className = "cert-descr">
            <div><b> Contract address :</b> {certificate.contractAddress} </div> 
            <div> {isowned?
               (<><b>Issued by :</b> {certificate.issuedBy}</>) 
               :(<><b>Issued to :</b> {certificate.issuedTo}</>)
            }</div> 
            <div> <b>Signature :</b> {certificate.signature} </div>
         </div>
      </div>
   )
}


