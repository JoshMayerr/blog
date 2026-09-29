import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { randomUUID } from "node:crypto";
import { privateKeyToAccount } from "viem/accounts";
const ASSET = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const NETWORK = "eip155:84532";
import { writeFile, readFile } from "node:fs/promises";
const [mode, target, post, body] = process.argv.slice(2);
if (mode === "claim") {
  const saved = JSON.parse(await readFile(target, "utf8"));
  const response = await fetch(saved.deposit.claimUrl, { method: "POST" });
  console.log(response.status, await response.json());
} else if (mode === "resume") {
  await submit(
    JSON.parse(await readFile(target || "pending-comment.json", "utf8")),
  );
} else if (mode === "post") {
  if (!process.env.AGENT_PRIVATE_KEY || !target || !post || !body)
    throw new Error(
      'Usage: AGENT_PRIVATE_KEY=... node comment.mjs post BLOG_ORIGIN POST_SLUG "comment"; or node comment.mjs claim receipt.json',
    );
  try {
    await readFile("pending-comment.json");
    throw new Error(
      "A saved payment exists. Use resume, or archive pending-comment.json and receipt.json before a new comment.",
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY);
  const input = {
    site: "joshmayer.net",
    post,
    body,
    wallet: account.address,
    requestId: randomUUID(),
  };
  const endpoint = `${target}/api/comments`;
  const client = new x402Client().register(
    NETWORK,
    new ExactEvmScheme(account),
  );
  client.setSpendControls({
    allowedAssets: [
      {
        network: NETWORK,
        asset: ASSET,
        maxAmountPerPayment: process.env.MAX_DEPOSIT_MICROS || "100000",
      },
    ],
  });
  client.registerPolicy((_version, offers) =>
    offers.filter(
      (required) =>
        required.network === NETWORK &&
        required.asset.toLowerCase() === ASSET.toLowerCase() &&
        required.scheme === "exact" &&
        BigInt(required.amount) <=
          BigInt(process.env.MAX_DEPOSIT_MICROS || "100000"),
    ),
  );
  let recovery;
  let persisted = false;
  // Standard fetch transport handles 402 -> payment signing -> retry. This thin
  // transport hook saves the exact paid request before sending for crash recovery.
  const paidFetch = wrapFetchWithPayment(async (request) => {
    if (request.headers.has("PAYMENT-SIGNATURE")) {
      recovery = {
        endpoint: request.url,
        input: JSON.parse(await request.clone().text()),
        headers: Object.fromEntries(request.headers),
      };
      await writeFile(
        "pending-comment.json",
        JSON.stringify(recovery, null, 2),
        { mode: 0o600, flag: "wx" },
      );
      persisted = true;
    }
    return fetch(request, { redirect: "error" });
  }, client);
  let response;
  try {
    response = await paidFetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch (error) {
    if (!persisted) throw error;
    console.error("Request interrupted; recovering the same signed payment.");
  }
  if (response?.status === 200) {
    const result = await response.json();
    await writeFile("receipt.json", JSON.stringify(result, null, 2), {
      mode: 0o600,
    });
    console.log(JSON.stringify(result, null, 2));
  } else if (recovery && (!response || [202, 503].includes(response.status))) {
    await submit(recovery);
  } else {
    throw new Error(
      response ? JSON.stringify(await response.json()) : "No response",
    );
  }
} else {
  throw new Error(
    'Use: node comment.mjs post BLOG_ORIGIN POST_SLUG "comment"; resume pending-comment.json; or claim receipt.json',
  );
}

async function submit({ endpoint, input, headers }) {
  for (let i = 0; i < 15; i++) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(input),
      redirect: "error",
    });
    const result = await response.json();
    if (response.status === 200) {
      await writeFile("receipt.json", JSON.stringify(result, null, 2), {
        mode: 0o600,
      });
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    if (![202, 503].includes(response.status))
      throw new Error(JSON.stringify(result));
    if (i === 14)
      throw new Error(
        "Still pending. Replay pending-comment.json with the SAME headers and body; do not start another payment.",
      );
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}
