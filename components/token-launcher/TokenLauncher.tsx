import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { generateQuickSuggestion } from '../../services/geminiService';
import { CodeAccordion } from '../ui/CodeAccordion';
import { Instructions } from './Instructions';

const contractSource = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IPancakeRouter {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
}

interface IPancakeFactory {
    function createPair(address tokenA, address tokenB) external returns (address pair);
}

contract NanoBananaSwap is ERC20, ERC20Permit, Ownable, ReentrancyGuard {
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18;
    uint16 public liquidityFeeBP = 200;
    uint16 public marketingFeeBP = 100;
    uint16 public constant MAX_TOTAL_FEE_BP = 1500;
    address public marketingWallet;
    IPancakeRouter public pancakeRouter;
    address public pancakePair;
    bool public swapAndLiquifyEnabled = true;
    uint256 public swapTokensAtAmount = 5_000 * 10**18;
    bool private inSwapAndLiquify;

    mapping(address => bool) public isExcludedFromFees;
    mapping(address => bool) public automatedMarketMakerPairs;

    modifier lockTheSwap {
        inSwapAndLiquify = true;
        _;
        inSwapAndLiquify = false;
    }

    constructor(address _router, address _marketing) ERC20("Nano Banana", "NANO") ERC20Permit("Nano Banana") {
        pancakeRouter = IPancakeRouter(_router);
        marketingWallet = _marketing;
        pancakePair = IPancakeFactory(pancakeRouter.factory()).createPair(address(this), pancakeRouter.WETH());
        automatedMarketMakerPairs[pancakePair] = true;
        isExcludedFromFees[msg.sender] = true;
        isExcludedFromFees[address(this)] = true;
        isExcludedFromFees[marketingWallet] = true;
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    function _transfer(address from, address to, uint256 amount) internal override {
        if (amount == 0 || isExcludedFromFees[from] || isExcludedFromFees[to]) {
            super._transfer(from, to, amount);
            return;
        }

        uint256 contractTokenBalance = balanceOf(address(this));
        if (contractTokenBalance >= swapTokensAtAmount && swapAndLiquifyEnabled && !inSwapAndLiquify && !automatedMarketMakerPairs[from]) {
            swapAndLiquify(swapTokensAtAmount);
        }

        uint256 totalFeeBP = liquidityFeeBP + marketingFeeBP;
        uint256 feeAmount = (amount * totalFeeBP) / 10000;
        super._transfer(from, address(this), feeAmount);
        super._transfer(from, to, amount - feeAmount);
    }

    function swapAndLiquify(uint256 contractTokenBalance) private lockTheSwap nonReentrant {
        uint256 totalFee = liquidityFeeBP + marketingFeeBP;
        if (totalFee == 0) return;

        uint256 liquidityTokens = (contractTokenBalance * liquidityFeeBP) / totalFee;
        uint256 marketingTokens = contractTokenBalance - liquidityTokens;
        uint256 halfLiquidity = liquidityTokens / 2;
        uint256 otherHalfLiquidity = liquidityTokens - halfLiquidity;
        uint256 tokensToSwapForBNB = marketingTokens + halfLiquidity;

        swapTokensForBNB(tokensToSwapForBNB);
        uint256 newBNBBalance = address(this).balance;
        if(newBNBBalance == 0) return;

        uint256 bnbForLiquidity = (newBNBBalance * halfLiquidity) / tokensToSwapForBNB;
        if (otherHalfLiquidity > 0 && bnbForLiquidity > 0) {
            addLiquidity(otherHalfLiquidity, bnbForLiquidity);
        }
        if (address(this).balance > 0) {
           payable(marketingWallet).transfer(address(this).balance);
        }
    }

    function swapTokensForBNB(uint256 tokenAmount) private {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = pancakeRouter.WETH();
        _approve(address(this), address(pancakeRouter), tokenAmount);
        pancakeRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(tokenAmount, 0, path, address(this), block.timestamp);
    }

    function addLiquidity(uint256 tokenAmount, uint256 bnbAmount) private {
        _approve(address(this), address(pancakeRouter), tokenAmount);
        pancakeRouter.addLiquidityETH{value: bnbAmount}(address(this), tokenAmount, 0, 0, owner(), block.timestamp);
    }
}`;

const deployScript = `const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // BSC mainnet PancakeSwap v2 router
  const pancakeRouterAddr = process.env.PANCAKE_ROUTER || "0x10ED43C718714eb63d5aA57B78B54704E256024E";
  const marketingWallet = process.env.MARKETING_WALLET || deployer.address;

  const NanoBanana = await hre.ethers.getContractFactory("NanoBananaSwap");
  const token = await NanoBanana.deploy(pancakeRouterAddr, marketingWallet);
  await token.deployed();
  console.log("NanoBananaSwap deployed at:", token.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});`;

const hardhatConfig = `require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.binance.org:8545/",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : []
    },
    bscMainnet: {
      url: process.env.BSC_MAINNET_RPC || "https://bsc-dataseed.binance.org/",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: process.env.BSCSCAN_API_KEY || ""
  }
};`;

export const TokenLauncher: React.FC = () => {
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [supply, setSupply] = useState('1000000000');
    const [isDeploying, setIsDeploying] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [result, setResult] = useState<{ hash: string; rpcUrl: string } | null>(null);

    const handleSuggest = async () => {
        setIsSuggesting(true);
        try {
            const suggestionPrompt = `Generate a creative and unique name for a new cryptocurrency token. The name should be short, memorable, and suitable for the BNB Smart Chain ecosystem. For example: "Cosmic Banana" or "Cyber Peel". Just return the name.`;
            const suggestedName = await generateQuickSuggestion(suggestionPrompt);
            const cleanedName = suggestedName.replace(/["*]/g, '').trim();
            setName(cleanedName);

            const symbolPrompt = `Based on the token name "${cleanedName}", generate a 3-5 letter ticker symbol. For example, for "Cosmic Banana" you might suggest "CBAN". Just return the symbol.`;
            const suggestedSymbol = await generateQuickSuggestion(symbolPrompt);
            // FIX: Escaped the dollar sign `$` in the regex to prevent parsing errors.
            const cleanedSymbol = suggestedSymbol.replace(/["*\\$]/g, '').trim().toUpperCase();
            setSymbol(cleanedSymbol);
        } catch (error) {
            console.error("Failed to get suggestion:", error);
            alert("Could not generate a suggestion at this time.");
        } finally {
            setIsSuggesting(false);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsDeploying(true);
        setResult(null);

        setTimeout(() => {
            setResult({
                hash: `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
                rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/'
            });
            setIsDeploying(false);
        }, 1500);
    };

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Launch Your BEP-20 Token</CardTitle>
                <CardDescription>Fill in the details below to deploy your token to the BSC Testnet.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Token Name</Label>
                        <Input id="name" placeholder="e.g., Nano Banana Coin" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="symbol">Symbol</Label>
                        <Input id="symbol" placeholder="e.g., NANOB" value={symbol} onChange={(e) => setSymbol(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="supply">Total Supply</Label>
                        <Input id="supply" type="number" placeholder="1000000000" value={supply} onChange={(e) => setSupply(e.target.value)} required disabled title="Supply is fixed in the contract for this demo." />
                         <p className="text-xs text-gray-400">Note: Total supply is fixed at 1 Billion in the provided smart contract.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button type="button" variant="secondary" onClick={handleSuggest} disabled={isSuggesting} className="w-full sm:w-auto">
                            {isSuggesting ? <Spinner size="sm" className="mr-2" /> : '✨'} Suggest with AI
                        </Button>
                        <Button type="submit" disabled={isDeploying || !name || !symbol || !supply} className="flex-1">
                            {isDeploying && <Spinner size="sm" className="mr-2" />}
                            {isDeploying ? 'Deploying...' : 'Deploy to Testnet'}
                        </Button>
                    </div>
                </form>

                {result && (
                     <div className="mt-8 space-y-6">
                        <div className="p-4 bg-gray-700/50 border border-green-500 rounded-lg">
                            <h3 className="font-bold text-green-400">Mock Deployment Successful!</h3>
                            <p className="text-sm text-gray-300 mt-1">
                                This is a simulation. To deploy for real, follow the developer instructions below.
                            </p>
                            <div className="mt-2 space-y-1 text-sm break-all">
                                <p><span className="font-semibold text-gray-300">Mock Tx Hash:</span> {result.hash}</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-6 space-y-4">
                            <div>
                                <h3 className="text-xl font-bold text-yellow-300">Developer Deployment Kit</h3>
                                <p className="text-gray-400 mt-1">
                                    Use the following contract, scripts, and instructions to deploy your token using Hardhat.
                                </p>
                            </div>
                            
                            <CodeAccordion title="Contract Source" fileName="contracts/NanoBananaSwap.sol" language="solidity" code={contractSource} defaultOpen={true} />
                            <CodeAccordion title="Deployment Script" fileName="scripts/deploy.js" language="javascript" code={deployScript} />
                            <CodeAccordion title="Hardhat Configuration" fileName="hardhat.config.js" language="javascript" code={hardhatConfig} />
                            
                            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                                <h4 className="text-lg font-semibold text-gray-200 mb-4">Deployment Steps</h4>
                                <Instructions />
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};