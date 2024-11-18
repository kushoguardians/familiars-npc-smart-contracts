# Smart Contracts Documentation

This repository contains a set of smart contracts developed using the Hardhat framework. The contracts are designed to manage various aspects of a blockchain-based game, including NFTs, in-game currency, and resources.


## Prerequisites

Before you begin, ensure you have met the following requirements:

 - Node.js, npm and bun installed on your machine.
 - Hardhat installed globally or locally in your project.

## Installation

 1. Clone the repository: 
 `git clone https://github.com/kushoguardians/familiars-npc-smart-contracts.git`
 `cd familiars-npc-smart-contracts`
 2. Install dependencies: 
 `bun install`
 3. Compile the contracts:
 `bunx hardhat compile`
 4. Deploy the contracts:
 `bunx hardhat ignition deploy ignition/modules/Operator.ts`

## Environment Variables
To configure the environment variables required for deployment and interaction with the blockchain, use the following commands:

1. Set the wallet private key for development.
`bunx hardhat vars set PRIVATEKEY_DEV <your-private-key>`
2. Set the base RPC URL for the Base Sepolia test network. 
`bunx hardhat vars set BASE_SEPOLIA_RPC <your-sepolia-rpc-url>`
3. Set the Blockscout API key: 
`bunx hardhat vars set BLOCKSCOUT_API_KEY <your-blockscout-api-key>`

Ensure that these variables are set correctly before deploying or interacting with the contracts.

## Contracts Overview
1. Operator Contract : Manages interactions between Familiars and various game resources.
2. Familiars Contract : Manages NFT-based (ERC-721) familiar creatures with location tracking and health systems.
3. Coins Contract : Implements the game's coin system (ERC-20) with transfer restrictions.
4. Food Contract: Implements ERC1155 token for Food resources in the game.
5. Karmic Energy Contract: Implements ERC1155 token for Karmic energy resources in the game.
6. Marketplace Contract: Manages the exchange of coins for food and coins.
7. KarmicWellSpring Contract: Manages the exchange of Karmic Energy for food and coins.


## Testing
To run the tests for the contracts, use the following command: `bunx hardhat test`


