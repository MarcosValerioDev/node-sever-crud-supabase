import { rateLimit } from "express-rate-limit";
import { IS_TEST } from "../config/env.config";
import {
  GLOBAL_RATE_LIMIT,
  GLOBAL_RATE_LIMIT_WINDOW_MS,
  LOGIN_ATTEMPTS_WINDOW_MS,
  MAX_LOGIN_ATTEMPTS,
} from "../constants/app.constants";

const RATE_LIMIT_MESSAGE = {
  error: { code: "TOO_MANY_REQUESTS", message: "Muitas requisições. Tente novamente mais tarde." },
};

export const globalRateLimiter = rateLimit({
  windowMs: GLOBAL_RATE_LIMIT_WINDOW_MS,
  limit: GLOBAL_RATE_LIMIT,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: RATE_LIMIT_MESSAGE,
  skip: () => IS_TEST,
});

/** Proteção contra força bruta no login: só conta tentativas que falharam. */
export const signInRateLimiter = rateLimit({
  windowMs: LOGIN_ATTEMPTS_WINDOW_MS,
  limit: MAX_LOGIN_ATTEMPTS,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: RATE_LIMIT_MESSAGE,
  skip: () => IS_TEST,
});
