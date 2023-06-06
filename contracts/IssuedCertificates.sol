// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract IssuedCertificates {    
    address public owner;
    mapping (string => string) public signedCertificates;

    constructor()  {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    } 

    function addCertificate(string memory hash, string memory signature) public onlyOwner {
        signedCertificates[hash] = signature;
    }

    function deleteCertificate(string memory hash) public onlyOwner {
        delete signedCertificates[hash];
    }

}
