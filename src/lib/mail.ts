import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

export const sendMail = async (options: nodemailer.SendMailOptions) => {
    return await transporter.sendMail({
        from: `"Bouwbeslag.nl Website" <${process.env.SMTP_USER || "contact@bouwbeslag.nl"}>`,
        ...options,
    });
};
