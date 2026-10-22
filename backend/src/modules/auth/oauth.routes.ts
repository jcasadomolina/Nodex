import { Router, type RequestHandler } from "express";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "../../config/env.js";
import { HttpError } from "../../lib/http-error.js";
import { prisma } from "../../lib/prisma.js";
import { startSession } from "../../lib/session.js";

type Provider = "google" | "github";

type OAuthProfile = {
  provider: Provider;
  providerAccountId: string;
  name: string;
  email: string | undefined;
  avatarUrl: string | undefined;
};

type GitHubEmail = { value: string; primary?: boolean; verified?: boolean };

type Done = (err: unknown, user?: Express.User | false) => void;

export const oauthRouter = Router();

const configured = new Set<Provider>();

async function findOrCreateUser(profile: OAuthProfile) {
  const { provider, providerAccountId } = profile;

  const account = await prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId } },
  });
  if (account) return account.userId;

  if (!profile.email) return null;
  const email = profile.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.oAuthAccount.create({ data: { userId: existing.id, provider, providerAccountId } });
    return existing.id;
  }

  const user = await prisma.user.create({
    data: {
      name: profile.name,
      email,
      avatarUrl: profile.avatarUrl ?? null,
      oauthAccounts: { create: { provider, providerAccountId } },
    },
  });
  return user.id;
}

function verify(profile: OAuthProfile, done: Done) {
  findOrCreateUser(profile)
    .then((userId) => done(null, userId ? { id: userId } : false))
    .catch(done);
}

function callbackUrl(provider: Provider) {
  return `${env.APP_URL}/api/auth/${provider}/callback`;
}

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackUrl("google"),
        scope: ["profile", "email"],
        state: true,
      },
      (_accessToken, _refreshToken, profile, done) => {
        const email = profile.emails?.find((e) => e.verified)?.value;
        verify(
          {
            provider: "google",
            providerAccountId: profile.id,
            name: profile.displayName,
            email,
            avatarUrl: profile.photos?.[0]?.value,
          },
          done,
        );
      },
    ),
  );
  configured.add("google");
}

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: callbackUrl("github"),
        scope: ["user:email"],
        allRawEmails: true,
        state: true as unknown as string,
      },
      (_accessToken: string, _refreshToken: string, profile: passport.Profile & { username?: string }, done: Done) => {
        const emails = (profile.emails ?? []) as GitHubEmail[];
        const email = emails.find((e) => e.primary && e.verified)?.value;
        verify(
          {
            provider: "github",
            providerAccountId: profile.id,
            name: profile.displayName || profile.username || "Usuario de GitHub",
            email,
            avatarUrl: profile.photos?.[0]?.value,
          },
          done,
        );
      },
    ),
  );
  configured.add("github");
}

function requireProvider(provider: Provider): RequestHandler {
  return (_req, _res, next) => {
    if (!configured.has(provider)) {
      throw new HttpError(503, `El inicio de sesión con ${provider} no está configurado`);
    }
    next();
  };
}

const finishLogin: RequestHandler = async (req, res) => {
  await startSession(req, req.user!.id);
  res.redirect(`${env.APP_URL}/`);
};

for (const provider of ["google", "github"] as const) {
  oauthRouter.get(`/${provider}`, requireProvider(provider), passport.authenticate(provider, { session: false }));

  oauthRouter.get(
    `/${provider}/callback`,
    requireProvider(provider),
    passport.authenticate(provider, {
      session: false,
      failureRedirect: `${env.APP_URL}/login?error=${provider}`,
    }),
    finishLogin,
  );
}
