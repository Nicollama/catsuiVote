// src/seeders/seedBallots.js
const { Ballot, User, Candidate } = require("../models");
const nodeCrypto = require("crypto");
const { aesGcmEncrypt, wrapKey } = require("../utils/crypto");

async function seedBallots() {
  try {
    const users = await User.findAll({ where: { approved: true, role: "student" } });
    const candidates = await Candidate.findAll();

    if (users.length === 0 || candidates.length === 0) {
      console.log("No users or candidates to seed.");
      return;
    }

    for (const user of users) {
      for (const candidate of candidates) {
        // Encrypt vote
        const perKey = nodeCrypto.randomBytes(32);
        const { ciphertext, iv, tag } = aesGcmEncrypt(perKey, String(candidate.id));
        const wrappedKey = wrapKey(perKey);
        const voteHash = nodeCrypto.createHash("sha256").update(ciphertext).digest("hex");

        await Ballot.create({
          userId: user.id,
          candidateId: candidate.id,
          ciphertext: ciphertext.toString("base64"),
          iv,
          tag,
          wrappedKey: wrappedKey.toString("base64"),
          voteHash,
        });
      }
    }

    console.log("✅ Ballots seeded successfully.");
  } catch (err) {
    console.error("❌ Error seeding ballots:", err);
  }
}

// Run seed
seedBallots().then(() => process.exit());
