import React from 'react';
import LoginBtn from './LoginBtn.js'

const welcome_msg = `Welcome to our page if you haven't already, install 
Metamask create an account and click Login to use our Web App`;

export default function LoginPage({
	setAccounts,
   setCertificates,
   setRequests,
   setContracts,
   setUser,
   jwt,
   contractMethods
}){
	return (
		<div className = "login-page">
			<p>{welcome_msg}</p>
			<br/>
			<LoginBtn 
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