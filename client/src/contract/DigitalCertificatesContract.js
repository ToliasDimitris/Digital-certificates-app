import Web3 from 'web3';
import {code, abi} from '../contract/Contract_abi_code.js';

export default function create_contract(account, provider){
   let web3 = new Web3(provider);
   let contract = new web3.eth.Contract(abi);
   contract.options.from = account;
   let obj = {};

   obj.deploy = async function (){
      let newContract = await contract.deploy({data : code}).send();
      return newContract.options.address;
   }

   obj.addCertificate = async function (contractAddress, hash, signature){
      contract.options.address = contractAddress;
      let receipt = await contract.methods.addCertificate(hash, signature).send();
      return receipt;
   }

   obj.deleteCertificate = async function (contractAddress, hash){
      contract.options.address = contractAddress;
      let receipt = await contract.methods.deleteCertificate(hash).send();
      return receipt;
   }

   obj.getOwner = async function (contractAddress){
      contract.options.address = contractAddress;
      let owner = await contract.methods.owner().call();
      return owner;
   }

   obj.getSignedCertificate = async function (contractAddress, hash){
      contract.options.address = contractAddress;
      let signature = await contract.methods.signedCertificates(hash).call();
      return signature;
   }
   obj.ecRecover = function (hash, signature){
      return web3.eth.personal.ecRecover(hash, signature);
   }
   return obj;
}