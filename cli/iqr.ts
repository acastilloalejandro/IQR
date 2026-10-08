import { readFile, writeFile } from "node:fs/promises";
import { generateKeyPair, signCredential } from "../src/crypto.js";
import { hashDocument } from "../src/hash.js";
import { offlineQrPayload, onlineQrPayload, qrSvg } from "../src/qr.js";
import { verifyCredential, canonicalJson } from "../src/verify.js";
import type { IqrCredential } from "../src/types.js";

function usage(): never {
  console.log("IQR CLI\n\n  demo\n  create-demo <credential.json>\n  hash <file>\n  qr-offline <credential.json> <output.svg>\n  verify <credential.json> [document]");
  process.exit(1);
}

async function createDemo(path: string): Promise<void> {
  const keyPair = await generateKeyPair();
  const document = new TextEncoder().encode("IQR demonstration contract v1");
  const credential = await signCredential(
    {
      id: "demo-contract-001",
      type: "ContractCredential",
      issuer: "did:example:iqr-demo",
      documentHash: await hashDocument(document),
      version: "1.0.0",
      issuedAt: new Date().toISOString(),
      status: "valid",
      claims: { subject: "Demo contract", environment: "development" }
    },
    keyPair.secretKey,
    "did:example:iqr-demo#key-1"
  );
  await writeFile(path, JSON.stringify(credential, null, 2));
  console.log("Created " + path);
}

async function main(): Promise<void> {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  if (command === "create-demo") return createDemo(args[0] ?? "credential.json");

  if (command === "hash") {
    const bytes = new Uint8Array(await readFile(args[0] ?? usage()));
    console.log(await hashDocument(bytes));
    return;
  }

  if (command === "qr-offline") {
    const credential = JSON.parse(await readFile(args[0] ?? usage(), "utf8")) as IqrCredential;
    const output = args[1] ?? "iqr.svg";
    await writeFile(output, await qrSvg(offlineQrPayload(credential)));
    console.log("Wrote " + output);
    return;
  }

  if (command === "verify") {
    const credential = JSON.parse(await readFile(args[0] ?? usage(), "utf8")) as IqrCredential;
    const document = args[1] ? new Uint8Array(await readFile(args[1])) : undefined;
    const result = await verifyCredential(credential, { documentBytes: document, allowInlinePublicKey: true });
    console.log(canonicalJson(result));
    process.exitCode = result.status === "verified" ? 0 : 2;
    return;
  }

  if (command === "demo") {
    const path = "demo-credential.json";
    await createDemo(path);
    const credential = JSON.parse(await readFile(path, "utf8")) as IqrCredential;
    console.log("Offline payload:\n" + offlineQrPayload(credential));
    console.log("Online payload:\n" + onlineQrPayload(credential.id, "https://example.com"));
    console.log(canonicalJson(await verifyCredential(credential, { allowInlinePublicKey: true })));
    return;
  }

  usage();
}

await main();