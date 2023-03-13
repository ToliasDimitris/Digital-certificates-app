//Models database request objects 
//every request object should include the certificate object it refers to 
//so that it can be easily accessed

export default function RequestObj({
	id, 
	certificate, 
	type
}={}){	
	this.id = id;
	this.certificate = certificate;
	this.type = type;
}

