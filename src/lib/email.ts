import nodemailer from "nodemailer";

type SendMailParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type SmtpCredentials = {
  user: string;
  pass: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
};

function normalizeEnvValue(value?: string) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  const isWrappedInMatchingQuotes =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));

  return isWrappedInMatchingQuotes ? trimmed.slice(1, -1).trim() : trimmed;
}

function getBooleanEnvValue(value?: string) {
  const normalized = normalizeEnvValue(value).toLowerCase();

  return normalized === "true" || normalized === "1";
}

function getSmtpCredentials(): SmtpCredentials | null {
  const user = normalizeEnvValue(process.env.SMTP_USER);
  const pass = normalizeEnvValue(process.env.SMTP_PASS).replace(/\s+/g, "");

  if (!user || !pass) {
    return null;
  }

  return { user, pass };
}

function getSmtpConfig(): SmtpConfig | null {
  const host = normalizeEnvValue(process.env.SMTP_HOST);
  const rawPort = normalizeEnvValue(process.env.SMTP_PORT) || "587";
  const port = Number(rawPort);
  const secure =
    process.env.SMTP_SECURE === undefined
      ? port === 465
      : getBooleanEnvValue(process.env.SMTP_SECURE);

  if (!host || Number.isNaN(port)) {
    return null;
  }

  return { host, port, secure };
}

function getMailFrom(credentials: SmtpCredentials) {
  return normalizeEnvValue(process.env.MAIL_FROM) || credentials.user;
}

export function isMailerConfigured() {
  return Boolean(getSmtpConfig() && getSmtpCredentials());
}

export function shouldAwaitEmailDelivery() {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

export async function sendMail({
  to,
  subject,
  html,
  text,
}: SendMailParams) {
  const credentials = getSmtpCredentials();
  const smtpConfig = getSmtpConfig();

  if (!credentials || !smtpConfig) {
    throw new Error("SMTP is not configured.");
  }

  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: credentials,
    tls: {
      servername: smtpConfig.host,
    },
  });

  const info = await transporter.sendMail({
    from: getMailFrom(credentials),
    to,
    subject,
    html,
    text,
  });

  console.info("Email accepted by SMTP server", {
    accepted: info.accepted,
    rejected: info.rejected,
    messageId: info.messageId,
    response: info.response,
  });

  return info;
}
