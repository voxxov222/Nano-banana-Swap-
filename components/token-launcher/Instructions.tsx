import React from 'react';
import { CodeBlock } from '../ui/CodeBlock';

const installCommands = `npm init -y
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers @nomiclabs/hardhat-etherscan
npm install @openzeppelin/contracts
npx hardhat # Choose "Create an empty hardhat.config.js"`;

const envExample = `DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545/
PANCAKE_ROUTER=0x... (use correct address for testnet/mainnet)
MARKETING_WALLET=0xYourMarketingWallet
BSCSCAN_API_KEY=your_bscscan_api_key`;

const compileCommand = `npx hardhat compile`;
const deployCommand = `npx hardhat run --network bscTestnet scripts/deploy.js`;


export const Instructions: React.FC = () => (
    <div className="space-y-4 text-gray-300 text-sm">
        <div>
            <h5 className="font-semibold text-gray-200">1. Install dependencies:</h5>
            <CodeBlock code={installCommands} language="bash" fileName="Terminal" />
        </div>
        <div>
            <h5 className="font-semibold text-gray-200">2. Add Files:</h5>
            <p className="mt-1">Place the provided contract, script, and config files into your Hardhat project directory as shown in the accordions above.</p>
        </div>
        <div>
            <h5 className="font-semibold text-gray-200">3. Set Environment Variables:</h5>
            <p className="mt-1">Create a <code className="bg-gray-700 text-yellow-300 px-1 rounded-sm text-xs">.env</code> file in your project root with the following content.</p>
            <CodeBlock code={envExample} language="text" fileName=".env" />
        </div>
        <div>
            <h5 className="font-semibold text-gray-200">4. Compile Contract:</h5>
            <CodeBlock code={compileCommand} language="bash" fileName="Terminal" />
        </div>
        <div>
            <h5 className="font-semibold text-gray-200">5. Deploy to BSC Testnet:</h5>
            <p className="mt-1">The contract address will be printed in your console upon successful deployment.</p>
            <CodeBlock code={deployCommand} language="bash" fileName="Terminal" />
        </div>
    </div>
);
