const { makeid } = require('./gen-id');
const express = require('express');
const fs = require('fs');
const pino = require("pino");
const router = express.Router();

const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    Browsers,
    makeCacheableSignalKeyStore,
    DisconnectReason
} = require('@whiskeysockets/baileys');

const { upload } = require('./mega');

/* ================= UTIL ================= */

function removeFile(path) {
    try {
        if (fs.existsSync(path)) {
            fs.rmSync(path, { recursive: true, force: true });
        }
    } catch {}
}

function randomBrowser() {
    const items = ["Safari"];
    return items[Math.floor(Math.random() * items.length)];
}

/* ================= ROUTE ================= */

router.get('/', async (req, res) => {
    const id = makeid();
    let number = req.query.number;

    if (!number) {
        return res.send({ error: "Number required" });
    }

    number = number.replace(/[^0-9]/g, '');

    async function RANUMITHA_X_MD_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState(`./temp/${id}`);
        let sock;

        try {
            sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(
                        state.keys,
                        pino({ level: "fatal" })
                    )
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }),
                browser: Browsers.macOS(randomBrowser())
            });

            sock.ev.on('creds.update', saveCreds);

            /* ===== PAIRING CODE ===== */
            if (!sock.authState.creds.registered) {
                await delay(1500);
                const code = await sock.requestPairingCode(number);
                if (!res.headersSent) {
                    res.send({ code });
                }
            }

            /* ===== CONNECTION UPDATE ===== */
            sock.ev.on("connection.update", async (update) => {
                const { connection, lastDisconnect } = update;

                if (connection === "open") {
                    await delay(3000);

                    const credsPath = `./temp/${id}/creds.json`;
                    if (!fs.existsSync(credsPath)) return;

                    const megaUrl = await upload(
                        fs.createReadStream(credsPath),
                        `${sock.user.id}.json`
                    );

                    const session =
                        "ranu&" + megaUrl.replace("https://mega.nz/file/", "");

                    const sent = await sock.sendMessage(
                        sock.user.id,
                        { text: session }
                    );

                    const msg = `*Hey there, RANUMITHA-X-MD user!* 👋🏻

✅ Your session has been created successfully.

🔐 *Session ID:* Sent above  
⚠️ *Do NOT share this ID*

——————
📢 WhatsApp Channel  
https://whatsapp.com/channel/0029VbBSa2tIN9iqWW0kaU20

💬 Support Group  
https://chat.whatsapp.com/JNATLE4Sywc7XWJb7Wh8ka

——————
> © Powered by 𝗥𝗔𝗡𝗨𝗠𝗜𝗧𝗛𝗔-𝗫-𝗠𝗗 🌛`;

                    await sock.sendMessage(
                        sock.user.id,
                        {
                            text: msg,
                            contextInfo: {
                                externalAdReply: {
                                    title: "RANUMITHA-X-MD",
                                    thumbnailUrl:
                                        "https://raw.githubusercontent.com/Ranumithaofc/RANU-FILE-S-/refs/heads/main/images/IMG-20250711-WA0010.jpg",
                                    sourceUrl:
                                        "https://whatsapp.com/channel/0029VbBSa2tIN9iqWW0kaU20",
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            }
                        },
                        { quoted: sent }
                    );

                    await delay(1000);
                    await sock.ws.close();
                    removeFile(`./temp/${id}`);
                }

                if (
                    connection === "close" &&
                    lastDisconnect?.error?.output?.statusCode !==
                        DisconnectReason.loggedOut
                ) {
                    await delay(2000);
                    RANUMITHA_X_MD_PAIR_CODE();
                }
            });

        } catch (err) {
            console.log("ERROR:", err);
            removeFile(`./temp/${id}`);
            if (!res.headersSent) {
                res.send({ error: "Service unavailable" });
            }
        }
    }

    RANUMITHA_X_MD_PAIR_CODE();
});

/* ================= AUTO RESTART (1 MIN) ================= */

setInterval(() => {
    console.log("♻️ Auto Restarting (1 minute)...");
    process.exit(0);
}, 60 * 1000); // 1 minute

module.exports = router;
