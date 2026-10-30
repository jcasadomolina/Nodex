import { Router, type Request, type RequestHandler } from "express";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "../../config/env.js";
import { HttpError } from "../../lib/http-error.js";
import { prisma } from "../../lib/prisma.js";
import { startSession } from "../../lib/session.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { requireRealUser } from "../../middleware/require-real-user.js";

export const PROVIDERS = ["google", "github"] as const;

type Provider = (typeof PROVIDERS)[number];

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

async function linkAccount(userId: string, { provider, providerAccountId }: OAuthProfile) {
  const account = await prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId } },
  });

  if (!account) {
    await prisma.oAuthAccount.create({ data: { userId, provider, providerAccountId } });
    return userId;
  }
  if (account.userId === userId) return userId;

  const owner = await prisma.user.findUnique({
    where: { id: account.userId },
    select: { passwordHash: true, _count: { select: { oauthAccounts: true, groups: true, nodexs: true } } },
  });
  const ownerIsEmpty =
    owner &&
    !owner.passwordHash &&
    owner._count.oauthAccounts === 1 &&
    owner._count.groups === 0 &&
    owner._count.nodexs === 0;

  if (!ownerIsEmpty) return null;

  await prisma.$transaction([
    prisma.oAuthAccount.update({ where: { id: account.id }, data: { userId } }),
    prisma.user.delete({ where: { id: account.userId } }),
  ]);
  return userId;
}

function verify(req: Request, profile: OAuthProfile, done: Done) {
  const linkUserId = req.session.linkUserId;
  const result = linkUserId ? linkAccount(linkUserId, profile) : findOrCreateUser(profile);

  result.then((userId) => done(null, userId ? { id: userId } : false)).catch(done);
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
        passReqToCallback: true,
      },
      (req, _accessToken, _refreshToken, profile, done) => {
        const email = profile.emails?.find((e) => e.verified)?.value;
        verify(
          req,
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
        passReqToCallback: true,
      },
      (
        req: Request,
        _accessToken: string,
        _refreshToken: string,
        profile: passport.Profile & { username?: string },
        done: Done,
      ) => {
        const emails = (profile.emails ?? []) as GitHubEmail[];
        const email = emails.find((e) => e.primary && e.verified)?.value;
        verify(
          req,
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

for (const provider of PROVIDERS) {
  oauthRouter.get(`/${provider}`, requireProvider(provider), (req, res, next) => {
    delete req.session.linkUserId;
    passport.authenticate(provider, { session: false })(req, res, next);
  });

  oauthRouter.get(`/${provider}/link`, requireAuth, requireRealUser, requireProvider(provider), (req, res, next) => {
    req.session.linkUserId = req.session.userId!;
    passport.authenticate(provider, { session: false })(req, res, next);
  });

  oauthRouter.get(
    `/${provider}/callback`,
    requireProvider(provider),
    (req, res, next) => {
      const page = req.session.linkUserId ? "perfil" : "login";
      passport.authenticate(provider, {
        session: false,
        failureRedirect: `${env.APP_URL}/${page}?error=${provider}`,
      })(req, res, next);
    },
    async (req, res) => {
      const linked = Boolean(req.session.linkUserId);
      await startSession(req, req.user!.id);
      res.redirect(linked ? `${env.APP_URL}/perfil?linked=${provider}` : `${env.APP_URL}/`);
    },
  );
}
