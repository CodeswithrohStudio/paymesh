const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
    const pk = "bde36e18ca5ebad317e4adec78d0cf0b9417467478bc5274bbe7df851738d8f2";
    
    // 1. Deploy PayMesh to Base Sepolia
    const baseRpc = new ethers.providers.JsonRpcProvider("https://sepolia.base.org");
    const baseWallet = new ethers.Wallet(pk, baseRpc);
    
    const payMeshJson = JSON.parse(fs.readFileSync(path.join(__dirname, "out/PayMesh.sol/PayMesh.json")));
    const payMeshFactory = new ethers.ContractFactory(payMeshJson.abi, payMeshJson.bytecode, baseWallet);
    const usdcBaseSepolia = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    
    console.log("Deploying PayMesh to Base Sepolia...");
    try {
      const payMeshContract = await payMeshFactory.deploy(usdcBaseSepolia);
      await payMeshContract.deployed();
      const payMeshAddress = payMeshContract.address;
      console.log("✅ PayMesh deployed to:", payMeshAddress);

      // 2. Deploy Subdomain to Eth Sepolia
      const ethRpc = new ethers.providers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
      const ethWallet = new ethers.Wallet(pk, ethRpc);
      
      const subJson = JSON.parse(fs.readFileSync(path.join(__dirname, "out/PayMeshSubdomain.sol/PayMeshSubdomain.json")));
      const subFactory = new ethers.ContractFactory(subJson.abi, subJson.bytecode, ethWallet);
      
      console.log("\nDeploying PayMeshSubdomain to Ethereum Sepolia...");
      const subContract = await subFactory.deploy();
      await subContract.deployed();
      const subAddress = subContract.address;
      console.log("✅ PayMeshSubdomain deployed to:", subAddress);
      
      // 3. Update src/lib/contract.ts
      const contractFilePath = path.join(__dirname, "../src/lib/contract.ts");
      let contractContent = fs.readFileSync(contractFilePath, "utf8");
      
      contractContent = contractContent.replace(
          /PAYMESH_CONTRACT_ADDRESS = \([\s\S]*?\)/, 
          `PAYMESH_CONTRACT_ADDRESS = (\n  process.env.NEXT_PUBLIC_PAYMESH_CONTRACT || '${payMeshAddress}'\n)`
      );
      contractContent = contractContent.replace(
          /SUBDOMAIN_CONTRACT_ADDRESS = \([\s\S]*?\)/, 
          `SUBDOMAIN_CONTRACT_ADDRESS = (\n  process.env.PAYMESH_SUBDOMAIN_CONTRACT || '${subAddress}'\n)`
      );
      fs.writeFileSync(contractFilePath, contractContent);
      console.log("\n✅ Auto-Updated src/lib/contract.ts with live deployment addresses.");
      
      console.log("\n==================================");
      console.log("USER .ENV.LOCAL PAYLOAD");
      console.log("==================================");
      console.log(`NEXT_PUBLIC_SUPABASE_URL="https://jhqwknbyzzqwejpvfonz.supabase.co"`);
      console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpocXdrbmJ5enpxd2VqcHZmb256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMzE3OTEsImV4cCI6MjA5MDcwNzc5MX0.GTcOk0GQhbHY2-b9aY3pBC9lIFJS5E88n2m75KI9t-A"`);
      console.log(`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="mock_project_id"`);
      console.log(`NEXT_PUBLIC_PAYMESH_CONTRACT="${payMeshAddress}"`);
      console.log(`PAYMESH_SUBDOMAIN_CONTRACT="${subAddress}"`);

    } catch (e) {
      console.error("Deploy Error:", e);
    }
}

main().catch(console.error);
