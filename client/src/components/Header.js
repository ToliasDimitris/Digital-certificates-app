import React, {useEffect} from 'react';


export default function Header({
  setIsvalidator,
  init

}){

  function handleAccountsChanged(accounts){
    init();
  }

  // mount,unmount of this component <==>  user change 
  //on mount adds listener , on unmount removes it, works! 
  useEffect(()=>{
    window.ethereum.on('accountsChanged',handleAccountsChanged);
    return ()=>{window.ethereum.removeListener('accountsChanged',handleAccountsChanged)};
  },[]) 

	return(
    	<div className = "header">
         <div className = "nav-cert" onClick = { ()=>{setIsvalidator(false)} } >
            Certificates
         </div>        
         <div className = "nav-valid" onClick = { ()=>{setIsvalidator(true)} } >
            Validator
         </div>
         <div className = "nav-logout" onClick = { ()=>{init()} } >
            Logout
         </div>
    	</div>
   ) 
 
}