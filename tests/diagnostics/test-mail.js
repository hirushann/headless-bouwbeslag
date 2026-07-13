import nodemailer from "nodemailer";

const smtpHost = "sandbox.smtp.mailtrap.io";
const smtpPort = 2525;
const smtpUser = "eac084c63120d1";
const smtpPass = "10dff8c462cfc7";

const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(smtpPort),
    secure: false, // true for 465, false for other ports
    auth: {
        user: smtpUser, // e.g. ""
        pass: smtpPass,
    },
});

async function main() {
    try {
        console.log("Sending email...");
        let info = await transporter.sendMail({
            from: '"Bouwbeslag.nl Website" <contact@bouwbeslag.nl>',
            to: "test@example.com",
            subject: "Hello ✔",
            text: "Hello world?",
            html: "<b>Hello world?</b>",
        });

        console.log("Message sent: %s", info.messageId);
    } catch (e) {
        console.error("Error sending email:", e);
    }
}

main();
