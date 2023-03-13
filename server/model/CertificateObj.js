//Models database certificate objects 

export default function CertificateObj({
	id, 
	issuedAt, 
	issuedBy,
	issuedTo,
	imgDataUrl,
	hash,
	signature,
	contractAddress
}={}){	
	this.id = id;
	this.issuedAt = issuedAt;
	this.issuedBy = issuedBy;
	this.issuedTo = issuedTo;
	this.imgDataUrl = imgDataUrl;
	this.hash = hash;
	this.signature = signature;
	this.contractAddress = contractAddress;
}

