import express from 'express';
import bodyParser from 'body-parser';
import mysql from 'mysql';
import config from './config.js';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import  ethUtil from 'ethereumjs-util';
import CertificateObj from './model/CertificateObj.js';
import RequestObj from './model/RequestObj.js';

const app = express();
const port = 3100;
const SECRET = "123456789";
const connection = mysql.createConnection(config.db);
const QUERIES = {
   'INSERT_CONTRACT' : "insert into `Contracts`(`contractAddress`, `ownerAddress`) values ('?','?')",
	'INSERT_USER' : "insert into `Users` (`publicKey`,`nonce`) values ('?',?)",
   'INSERT_REQUEST' : "insert into `Requests`(`certId`,`type`,`viewed`,`reqFrom`,`reqTo`) values (?,'?',?,'?','?')",
   'INSERT_RESPONSE' : "insert into `Responses`(`id`,`certId`,`type`,`viewed`,`reqFrom`,`reqTo`) values (?,?,'?',?,'?','?')",
   'INSERT_CERTIFICATE' : "insert into `Certificates`(`issuedAt`,`issuedBy`,`issuedTo`,`imgDataUrl`,`hash`) values (?,'?','?','?','?')",
	'GET_NONCE' : "select `nonce` from `Users` where `publicKey` = '?'",
   'GET_ROW' : "select * from `?` where `id` = ?", 
   'DELETE_ROW' : "delete from `?` where `id` = ?",
	'UPDATE_NONCE' : "update `Users` set `nonce` = ? where `publicKey` = '?' ",
   'UPDATE_CERTIFICATE' : "update `Certificates` set ? where `id` = ? ",
   'UPDATE_REQUEST' : "update `Requests` set `type` = '?', `viewed` = ? where `id` = ?",
   'UPDATE_RESPONSE' : "update `Responses` set `type` = '?', `viewed` = ? where `id` = ?",
	'GET_CERTIFICATES' : "select * from `Certificates` where '?' in ( `issuedBy` , `issuedTo` ) and `contractAddress` is not null",
   'GET_RESPONSES' : "select * from (select `id` as `reqId`, `certId`, `type`, `viewed` from `Responses` where `reqFrom` = '?' ) `t1` join `Certificates` on `t1`.`certId` = `Certificates`.`id` ",
   'GET_REQUESTS' : "select * from (select `id` as `reqId`, `certId`, `type`, `viewed` from `Requests` where `reqTo` = '?' ) `t1` join `Certificates` on `t1`.`certId` = `Certificates`.`id` ",
   'MARK_RESP_VIEWED' : "update `Responses` set `viewed` = true where `reqFrom` = '?' and `viewed` = false ",
   'MARK_REQ_VIEWED' : "update `Requests` set `viewed` = true where `reqTo` = '?' and `viewed` = false ",
   'GET_CONTRACTS' : "select * from `Contracts` where `ownerAddress` = '?' ",
   'GET_USER' : " select * from `Users` where `publicKey` = '?' ",
   'GET_UNVIEWED_RESPONSES' : "select * from (select `id` as `reqId`, `certId`, `type`, `viewed` from `Responses` where `reqFrom` = '?' and `viewed` = false ) `t1` join `Certificates` on `t1`.`certId` = `Certificates`.`id` ",
   'GET_UNVIEWED_REQUESTS' : "select * from (select `id` as `reqId`, `certId`, `type`, `viewed` from `Requests` where `reqTo` = '?' and `viewed` = false ) `t1` join `Certificates` on `t1`.`certId` = `Certificates`.`id` "   
}

app.use(
	bodyParser.urlencoded({
		extended: true,
	}),
	bodyParser.json(),
	cors()
);

//verifies token for every request starting with /user
app.use('/user', (req, res, next) =>{
	let token = req.body.jwt;
	req.token = verify_token (token, SECRET);
	if (!req.token){
		res.status(404).json({
         success : false,
         error: "INVALID TOKEN"
      });
	}
	else{
		next();
	}
});

//wrapping sql queries with promise
function exec_query(prepared_statement){
	return new Promise((resolve, reject) => {
		connection.query(prepared_statement, (error, result, fields) =>{
			if (error)  {
				reject(error);
			}
			else {
				resolve(result);
			}
		});
	});
}

function create_statement(sql_statement, values){
	let i = 0;
	let statement = sql_statement.replaceAll('?', () => {return values[i++]});
	return statement;
}

//sql statement to get nonce from user with address 
function get_nonce(result){
	let obj = {};
	let nonce = (result ? result[0]?.Nonce : null);
	let msg = ' Sign this nonce to login: ';  
	obj.sign_msg = msg + (nonce ? nonce : create_nonce());
	return obj;
}

// return a random nonce
function create_nonce(){
	return Math.floor(Math.random()*1000000);
}

//decrypts signature with msg and gets an address then checks if address === eth_address
function valid_signature(signature, msg, eth_address){
	const msgHex = ethUtil.bufferToHex(Buffer.from(msg));
	const msgBuffer = ethUtil.toBuffer(msgHex);
	const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
	const signatureBuffer = ethUtil.toBuffer(signature);
	const signatureParams = ethUtil.fromRpcSig(signatureBuffer);
	const publicKey = ethUtil.ecrecover(
			msgHash,
			signatureParams.v,
			signatureParams.r,
			signatureParams.s
	);
	const addresBuffer = ethUtil.publicToAddress(publicKey);
	const address = ethUtil.bufferToHex(addresBuffer);
	return address === eth_address;
}

function create_token(address, secret){
	let token = jwt.sign( {address: address}, secret);
	return token;
}

function verify_token(token, secret){
	try{
		//if not valid token it ll throw an error
		let payload = jwt.verify(token, secret);
		return payload;
	}
	catch(err){
		console.log(err);
		return null;
	}
}


//Login flow
app.get('/:user_address/nonce',  (req,res,next) => {
	//TODO validate ethereum incoming address before doing anything else
	let address = req.params.user_address;
	//validate(address); 	
	exec_query(create_statement(QUERIES.GET_NONCE,[address]))
	.then( (result) =>{
		res.json(get_nonce(result));
	})
	.catch( (err) =>{
		res.status(404).json({
         error : err.message
      });
	}) 
	
});


app.post('/:user_address/signature',  (req,res,next) => {
	//TODO validate ethereum incoming address before doing anything else
	let address = req.params.user_address;
	let signature = req.body.signature;
	let sign_msg = req.body.sign_msg;
	let nonce = sign_msg.slice(26);
	//verify signature  if invalid return error
	if (!valid_signature(signature, sign_msg, address)){
		res.status(404).json({
         error: "INVALID SIGNATURE"
      });
	}
	//if logs first time insert user (address,nonce) , return jwt
	else{
		//create new nonce 
		nonce = create_nonce();
		let jwt = create_token(address, SECRET);
		exec_query(create_statement(QUERIES.GET_NONCE,[address]))
		.then( (results) => {
			if (!results.length > 0){
				return exec_query(create_statement(QUERIES.INSERT_USER,[address, nonce]));
			}
			else{			
				return exec_query(create_statement(QUERIES.UPDATE_NONCE,[nonce, address]));
			}
		})
		.then( () => res.json({'jwt':jwt}) )
		.catch( (err) =>{
			res.status(404).json({
            error: "SQL ERROR"
         });
		})
	}

});

//we use /user middleware to ensure logged in user
app.post('/user/fetch_userdata', async (req,res,next) => {
   try{   
      let address = req.token.address;
      let certificates = Array.from( await exec_query(create_statement(QUERIES.GET_CERTIFICATES, [address])) );
      //fetch all requests and mark them as viewed 
      let requests = await fetch_all_requests(address);
      let results = await exec_query(create_statement(QUERIES.GET_CONTRACTS, [address])); 
      let contracts = Array.from(results, row => row.contractAddress);
      let user = await exec_query(create_statement(QUERIES.GET_USER, [address])); 

      res.json({ 
         success : true,
         data : {
            certificates : certificates,
            requests : requests,
            contracts : contracts,    
            user : user[0]   
         } 
      })
   }
   catch(err){
      res.status(404).json({
         success : false,
         error: "ERROR FETCHING USER DATA"
      });
   }

});



//fetch all requests with issuedTo == address   requests join certificates 
//fetch all responses with issuedBy == address  responses join certificates
//mark all unviewed requests and responses as viewed 
//return an array with requests data
async function fetch_all_requests(address){
   try{
      let requests = [];

      let rows = await exec_query(create_statement(QUERIES.GET_REQUESTS, [address] ));       
      requests.push(...rowsToReqs(rows));
      await exec_query( create_statement(QUERIES.MARK_REQ_VIEWED, [address] ));
      
      rows = await exec_query(create_statement(QUERIES.GET_RESPONSES, [address] ));
      requests.push(...rowsToReqs(rows));
      await exec_query(create_statement(QUERIES.MARK_RESP_VIEWED, [address] ));

      return requests;
   }
   catch(err){
      throw err;
   }
}

//takes rows with Request and Certificate data and returns array with request objects
function rowsToReqs(rows) {
   let arr =  Array.from(rows);
   arr = arr.map( (reqCert) => {
      let cert = new CertificateObj({...reqCert});
      let req = new RequestObj({...reqCert});
      //fix id its reqId instead!!
      req.id = reqCert.reqId;
      //attach certificate object
      req.certificate = cert;
      return req;
   })
   return arr;
}

//fetches all unviewed user requests and marks them as viewed
//this endpoint will be hit at a set interval
app.post('/user/fetch_requests', async (req,res,next) => {
   try{
      let address = req.token.address;
      let requests = [];

      let rows = await exec_query(create_statement(QUERIES.GET_UNVIEWED_REQUESTS, [address] ));       
      requests.push(...rowsToReqs(rows));
      await exec_query(create_statement(QUERIES.MARK_REQ_VIEWED, [address] ));
      
      rows = await exec_query(create_statement(QUERIES.GET_UNVIEWED_RESPONSES, [address] ));
      requests.push(...rowsToReqs(rows));
      await exec_query(create_statement(QUERIES.MARK_RESP_VIEWED, [address] ));

      res.json({
         success : true,
         data :{
            requests : requests
         }
      })
   }
   catch(err){
      return res.status(404).json({
         success : false,
         error : "ERROR FETCHING REQUESTS"
      })
   }
});

//request interaction , we update request response objects and certificates
//the actions depend on the request type
app.post('/user/upd_requests', async (req,res,next) => {
   let address = req.token.address;
   let type = req.body.type;
   let data = req.body.data;
   let result = await handle_update(address, type, data);
   console.log(result);
   return res.json(result);
});

app.post('/user/insertContract', async (req,res,next) => {
   try{  
      let address = req.token.address;
      let contractAddress = req.body.contractAddress;
      let results = await exec_query(create_statement(QUERIES.INSERT_CONTRACT, [contractAddress, address]));
      return res.json({success : true});
   }
   catch(err){
      return res.json({success : false, error : err.message});
   }
});


async function handle_update(address, type, data){
   try{   
      switch(type){
         case 'ISS' :{            
            let cert_id = await insert_certificate(data.cert);
            let obj = {
               certId : cert_id,
               type : type,               
               viewed : false,
               reqFrom : data.cert.issuedBy,
               reqTo : data.cert.issuedTo
            };
            let req_id = await insert_request(obj);
            obj.id = req_id;
            obj.viewed = true;
            await insert_response(obj);
            return ({
               success : true,
               data : {
                  req_id : req_id,
                  cert_id : cert_id
               }
            });
         }

         case 'ISS_SIGNED' :{
            //TODO validate signature before update
            await update_certificate({
               signature : data.signature,
               id : data.cert.id
            });
            await update_request(data.req_id, type, true);
            await update_response(data.req_id, type, false);
            break;
         }

         case 'ISS_UPL' :{
            await update_certificate({
               contractAddress : data.contractAddress,
               id : data.cert.id
            });
            await update_request(data.req_id, type, false);
            await update_response(data.req_id, type, true);
            break;
         }

         case 'ISS_UPLFL' :{
            await update_request(data.req_id, type, false);
            await update_response(data.req_id, type, true);
            break;
         }
            
         case 'ISS_DECL' :{
            await update_request(data.req_id, type, true);
            await update_response(data.req_id, type, false);
            break;
         }

         case 'ISS_CLOSED' :{
            let table;
            if (address === data.cert.issuedBy){
               table = "Responses";
            }else if (address === data.cert.issuedTo){
               table = "Requests";
            }
            await delete_row(data.req_id, table);
            break;
         }
   
         case 'ISS_FL' :{            
            let table;
            let otherTable;
            if (address === data.cert.issuedBy){
               table = "Responses";
               otherTable = "Requests";
            }else if (address === data.cert.issuedTo){
               table = "Requests";
               otherTable = "Responses";
            }
            await delete_row(data.req_id, table);
            let results = await  exec_query(create_statement(QUERIES.GET_ROW, [otherTable, data.req_id]));
            if (!results.length > 0){
               await delete_row(data.cert.id, "Certificates");
            }
            break;
         }
      }
      return({
         success : true,
         data : {}
      })
   }
   catch(err){
      return ({
         success : false,
         error : err.message
      })
   }
}


async function insert_request({certId, type, viewed, reqFrom, reqTo})
{
   try{
      let result = await exec_query(create_statement(QUERIES.INSERT_REQUEST, [certId, type, viewed, reqFrom, reqTo]));
      return result.insertId;
   }
   catch(err){
      throw err;
   }
}

async function insert_response({id, certId, type, viewed, reqFrom, reqTo}){
   try{
      return exec_query(create_statement(QUERIES.INSERT_RESPONSE, [id, certId, type, viewed, reqFrom, reqTo]));
   }
   catch(err){
      throw err;
   }

}

async function insert_certificate({issuedAt, issuedBy, issuedTo, imgDataUrl, hash}){
   try{
      let result = await exec_query(create_statement(QUERIES.INSERT_CERTIFICATE, [issuedAt, issuedBy, issuedTo, imgDataUrl, hash]));
      return result.insertId;
   }
   catch(err){
      throw err;
   }
}

function update_request(id, type, viewed){
   return exec_query(create_statement(QUERIES.UPDATE_REQUEST, [type, viewed, id]));
}

function update_response(id, type, viewed){
   return exec_query(create_statement(QUERIES.UPDATE_RESPONSE, [type, viewed, id]));
}

//id, signature, contractAddress
function update_certificate(obj){
   let id;
   let str = '';
   for (let key of Object.keys(obj)){
      if (key === 'id'){
         id = obj[key];
      }
      else{
         let type = typeof(obj[key]);
         if ( type === 'number' || type === 'boolean' ){
            str += "`"+key+"`"+" = "+obj[key]+",";
         }
         else{
            str += "`"+key+"`"+" = '"+obj[key]+"',";
         }
      }
   }
   str = str.slice(0,-1);
   return exec_query(create_statement(QUERIES.UPDATE_CERTIFICATE, [str, id] ));
}

function delete_row(id, table){
   return exec_query(create_statement(QUERIES.DELETE_ROW, [table, id]));
}


app.get('/', async (req, res) => {
   res.json("Hello");
});

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
});