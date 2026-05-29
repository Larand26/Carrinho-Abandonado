import axios from "axios";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { errorConfig } from "../config/errorConfig.js";

type CriticalErrorPayload = {
  subject: string;
  location: string;
  error: unknown;
  timestamp?: Date;
  details?: Record<string, unknown>;
};

const templatePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../templates/error-alert.html",
);

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeError(error: unknown): { message: string; stack: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack || error.message,
    };
  }

  if (typeof error === "string") {
    return { message: error, stack: error };
  }

  try {
    const serialized = JSON.stringify(error, null, 2);
    return {
      message: serialized || "Erro desconhecido",
      stack: serialized || "Erro desconhecido",
    };
  } catch {
    return {
      message: "Erro desconhecido",
      stack: "Erro desconhecido",
    };
  }
}

async function loadTemplate(): Promise<string> {
  return await readFile(templatePath, "utf8");
}

export async function sendCriticalErrorNotification(
  payload: CriticalErrorPayload,
): Promise<void> {
  const template = await loadTemplate();
  const timestamp = payload.timestamp ?? new Date();
  const { message, stack } = normalizeError(payload.error);

  const formattedTimestamp = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "long",
    timeZone: "America/Sao_Paulo",
  }).format(timestamp);

  const html = template
    .replaceAll("{{subject}}", escapeHtml(payload.subject))
    .replaceAll("{{location}}", escapeHtml(payload.location))
    .replaceAll("{{message}}", escapeHtml(message))
    .replaceAll("{{stack}}", escapeHtml(stack))
    .replaceAll("{{timestamp}}", escapeHtml(formattedTimestamp))
    .replaceAll(
      "{{details}}",
      escapeHtml(
        payload.details
          ? JSON.stringify(payload.details, null, 2)
          : "Nenhum detalhe adicional informado.",
      ),
    )
    .replaceAll("{{app}}", "Carrinho Abandonado");

  const body = {
    to: errorConfig.email,
    subject: payload.subject,
    errorDetails: {
      location: payload.location,
      message,
      stack,
      timestamp: formattedTimestamp,
      details: payload.details ?? {},
    },
    html,
    app: "Carrinho Abandonado",
  };

  await axios.post(`${errorConfig.baseURL}/send-email/error`, body, {
    headers: {
      Authorization: `Bearer ${errorConfig.token}`,
      "Content-Type": "application/json",
    },
  });
}
