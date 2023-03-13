import React from 'react';
import Certificate from './Certificate.js';


export default function CertificatesPane({
  certificates,
  isowned,
  contracts,
  setContracts,
  contractMethods,
  jwt
}){  
  //a scroll pane with a collection of certs (owned or issued)
  // if !isowned include a button New cert
  
  
	return(
      <div className = "cert-pane">
         <div className = "cert-pane-header">
            {!isowned&&
            (<>      
               <button className = "create-btn" onClick = {createContract}>
                  Create contract
               </button>       
               <select 
                  className = "select-contract" 
                  value = {contracts.index} 
                  onChange = {(e)=>changeSelectedContract(e)} 
               >
                  <option className = "hidden-opt">
                     Select Contract
                  </option>
                  {contracts.array.map((contractAddress, index)=>         
                     <option key = {index} value = {index}>
                        {contractAddress}
                     </option> 
                  )}
               </select>
               <button className = "issue-btn" onClick = { ()=>{  
                  let form = document.getElementById("form");  
                  form.style.display = "flex";
                  form.style.justifyContent = "center";
               }}>
                  Issue Certificate
               </button>
            </>)}
         </div>
         <div className = "cert-pane-content">
            {certificates.map((certificate)=>(
               <Certificate
               key = {certificate.id}
               certificate = {certificate}
               isowned = {isowned}
               />
            ))}
         </div>
      </div>
   )

   async function createContract(){
      try{
         let contractAddress = (await contractMethods.current.deploy()).toLowerCase();      
         let json = await insertContract({
            contractAddress : contractAddress,
            jwt : jwt.current
         });
         if (!json.success) throw new Error("failure");
         setContracts({
            array : [...contracts.array, contractAddress],
            index : contracts.index
         });
         alert("Contract created succesfully!");
      }
      catch(err){
         alert("Contract creation failed... Please try again");
      }
   }

   function changeSelectedContract(e){
      let newIndex = e.target.value;
      setContracts({...contracts, index : newIndex});
   }

}


async function insertContract(obj){
   try{      
      let resp = await fetch('http://localhost:3100/user/insertContract', {
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