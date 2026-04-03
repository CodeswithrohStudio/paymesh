pragma solidity ^0.8.20;

contract PayMeshSubdomain {
    mapping(string => address) private labelToWallet;
    mapping(address => string) private walletToLabel;

    function createSubdomain(string memory label, address wallet) external {
        require(labelToWallet[label] == address(0), "Label taken");
        labelToWallet[label] = wallet;
        walletToLabel[wallet] = label;
    }

    function getWallet(string memory label) external view returns (address) {
        return labelToWallet[label];
    }

    function getSubdomain(address wallet) external view returns (string memory) {
        return walletToLabel[wallet];
    }
}
