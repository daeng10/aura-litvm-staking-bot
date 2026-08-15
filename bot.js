import { ethers } from "ethers";

const RPC_URL =
  process.env.RPC_URL ||
  "https://liteforge.rpc.caldera.xyz/http";

const PRIVATE_KEY = process.env.PRIVATE_KEY;

const AURA =
  "0x0B779FF5855bc4E6937EbFa64aBE7AB8207f09c3";

const STAKING =
  "0x9D001EAa62E3c8A7E3f5a47523Fa7DC3790fcBBB";

const SELECTOR = "0x7b0472f0";

const AMOUNT = ethers.parseUnits("5", 18);

const DURATION = 2592000n;

if (!PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY belum tersedia");
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const auraAbi = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function decimals() view returns (uint8)"
];

const aura = new ethers.Contract(
  AURA,
  auraAbi,
  wallet
);

function encodeStake(amount, duration) {
  return ethers.concat([
    SELECTOR,
    ethers.zeroPadValue(
      ethers.toBeHex(amount),
      32
    ),
    ethers.zeroPadValue(
      ethers.toBeHex(duration),
      32
    )
  ]);
}

async function main() {
  console.log("=== LITVM AURA STAKING ===");

  console.log("Wallet:", wallet.address);

  const network = await provider.getNetwork();

  console.log(
    "Chain ID:",
    network.chainId.toString()
  );

  const decimals = await aura.decimals();

  console.log(
    "AURA decimals:",
    decimals
  );

  const balance = await aura.balanceOf(
    wallet.address
  );

  console.log(
    "AURA balance:",
    ethers.formatUnits(
      balance,
      decimals
    )
  );

  if (balance < AMOUNT) {
    throw new Error(
      "Saldo AURA kurang dari 5 AURA"
    );
  }

  let allowance = await aura.allowance(
    wallet.address,
    STAKING
  );

  console.log(
    "Allowance:",
    ethers.formatUnits(
      allowance,
      decimals
    )
  );

  if (allowance < AMOUNT) {
    console.log("Mengirim approve...");

    const approveTx =
      await aura.approve(
        STAKING,
        ethers.MaxUint256
      );

    console.log(
      "Approve TX:",
      approveTx.hash
    );

    await approveTx.wait();

    console.log("Approve berhasil.");
  }

  const calldata =
    encodeStake(
      AMOUNT,
      DURATION
    );

  console.log(
    "Calldata:",
    calldata
  );

  console.log(
    "Mengirim 5 AURA / 30 hari..."
  );

  const tx =
    await wallet.sendTransaction({
      to: STAKING,
      value: 0n,
      data: calldata
    });

  console.log(
    "Stake TX:",
    tx.hash
  );

  const receipt =
    await tx.wait();

  console.log(
    "SUCCESS block:",
    receipt.blockNumber
  );
}

main().catch((error) => {
  console.error(
    error.shortMessage ||
    error.message ||
    error
  );

  process.exit(1);
});
