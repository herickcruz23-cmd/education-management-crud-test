// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CertificateVerification
/// @notice Issues and verifies student achievement certificates on-chain.
/// Each certificate is a simple NFT-like record: the school (contract owner
/// or an authorized issuer) mints a certificate for a student, storing an
/// IPFS hash pointing to the certificate's metadata (student name, course,
/// grade, issue date, etc). Anyone can verify a certificate by its ID
/// without needing special permissions - that's the point of putting it
/// on-chain.
contract CertificateVerification {
    struct Certificate {
        uint256 id;
        address issuer;
        string studentName;
        string courseName;
        string ipfsHash; // IPFS CID pointing to full certificate metadata/JSON
        uint256 issuedAt;
        bool revoked;
    }

    address public owner;
    uint256 private nextCertificateId = 1;

    mapping(uint256 => Certificate) public certificates;
    mapping(address => bool) public authorizedIssuers;

    event CertificateIssued(
        uint256 indexed certificateId,
        address indexed issuer,
        string studentName,
        string ipfsHash
    );
    event CertificateRevoked(uint256 indexed certificateId);
    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(
            msg.sender == owner || authorizedIssuers[msg.sender],
            "Not an authorized issuer"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }

    /// @notice Grants issuing rights to another address (e.g. a registrar's wallet).
    function authorizeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer);
    }

    /// @notice Revokes issuing rights from an address.
    function revokeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = false;
        emit IssuerRevoked(issuer);
    }

    /// @notice Issues a new certificate for a student.
    /// @param studentName Name of the student (kept simple/plaintext here;
    /// production systems may prefer storing a hash instead for privacy).
    /// @param courseName Name of the course/achievement.
    /// @param ipfsHash CID of the JSON metadata document already uploaded to IPFS.
    function issueCertificate(
        string calldata studentName,
        string calldata courseName,
        string calldata ipfsHash
    ) external onlyAuthorizedIssuer returns (uint256) {
        require(bytes(studentName).length > 0, "Student name required");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");

        uint256 certificateId = nextCertificateId++;

        certificates[certificateId] = Certificate({
            id: certificateId,
            issuer: msg.sender,
            studentName: studentName,
            courseName: courseName,
            ipfsHash: ipfsHash,
            issuedAt: block.timestamp,
            revoked: false
        });

        emit CertificateIssued(certificateId, msg.sender, studentName, ipfsHash);
        return certificateId;
    }

    /// @notice Revokes a previously issued certificate (e.g. issued in error).
    function revokeCertificate(uint256 certificateId) external onlyAuthorizedIssuer {
        require(certificates[certificateId].id != 0, "Certificate does not exist");
        certificates[certificateId].revoked = true;
        emit CertificateRevoked(certificateId);
    }

    /// @notice Verifies a certificate. Returns the full record; `exists` is
    /// false if the ID was never issued, so callers can distinguish a real
    /// certificate from an empty/default struct.
    function verifyCertificate(uint256 certificateId)
        external
        view
        returns (
            bool exists,
            bool revoked,
            address issuer,
            string memory studentName,
            string memory courseName,
            string memory ipfsHash,
            uint256 issuedAt
        )
    {
        Certificate memory cert = certificates[certificateId];
        exists = cert.id != 0;
        revoked = cert.revoked;
        issuer = cert.issuer;
        studentName = cert.studentName;
        courseName = cert.courseName;
        ipfsHash = cert.ipfsHash;
        issuedAt = cert.issuedAt;
    }

    /// @notice Total number of certificates issued so far (including revoked ones).
    function totalCertificates() external view returns (uint256) {
        return nextCertificateId - 1;
    }
}
