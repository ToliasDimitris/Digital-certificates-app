create table Users (
	
	publicKey 	varchar(100) primary key,			
	nonce 		int,		
	firstName	varchar(100),	
	lastName 	varchar(100),	
	email 		varchar(100) unique

); 

create table Certificates (

	id 					serial primary key,		
	issuedAt 			bigint unsigned,		
	issuedBy 			varchar(100),		
	issuedTo 			varchar(100),		
	imgDataUrl	  		mediumtext ,	
	hash	   			char(64) unique,	/* bytes of max length 64 */
	signature			varchar(132) unique,	
	contractAddress		varchar(100)		

);

create table Contracts (

    contractAddress   varchar(100) primary key,
    ownerAddress      varchar(100),
    foreign key (ownerAddress) references Users(publicKey)
);

create table Requests (

	id 				serial primary key,				
	certId	 		bigint unsigned not null,  
    type            varchar(100), 			
	viewed			bit(1),				/*(0 : false , 1: true  )*/
	reqTo	 		varchar(100), 				/*Foreign Key, redundant info to save from unecessary joins if there are no requests for user*/
	reqFrom			varchar(100),
	foreign key (certId) references Certificates(id)

);

create table Responses (

    id              bigint unsigned primary key,
    certId          bigint unsigned not null,  
    type            varchar(100),           
    viewed          bit(1),             /*(0 : false , 1: true  )*/
    reqTo           varchar(100),               /*Foreign Key, redundant info to save from unecessary joins if there are no requests for user*/
    reqFrom         varchar(100),
    foreign key (certId) references Certificates(id)

);

