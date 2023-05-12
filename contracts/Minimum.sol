// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Minimum is ERC721, Ownable {
    string private constant _name = "Minimum NFT";
    string private constant _symbol = "MIN";

    constructor() ERC721(_name, _symbol) {}

    uint256 public id;

    function mint(address to, uint256 tokenId) public onlyOwner {
        _mint(to, tokenId);
    }

    function burn(uint256 tokenId) public onlyOwner {
        _burn(tokenId);
    }
}
