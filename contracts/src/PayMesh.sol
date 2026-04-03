pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract PayMesh {
    address public owner;
    uint256 public feePercent = 2; // 2% fee
    IERC20 public usdc;

    constructor(address _usdc) {
        owner = msg.sender;
        usdc = IERC20(_usdc);
    }

    function processPayment(address developer, uint256 amount) external {
        uint256 fee = (amount * feePercent) / 100;
        uint256 payout = amount - fee;

        require(usdc.transferFrom(msg.sender, address(this), amount), "Fee transfer failed");
        require(usdc.transfer(developer, payout), "Payout failed");
    }
}
