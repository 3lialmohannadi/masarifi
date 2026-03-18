import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import * as fs from "fs";
import * as path from "path";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
app.use(compression());
const log = console.log;

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

function setupCors(app: express.Application) {
  const allowedLocalPorts = new Set(["3000", "5000", "8081", "19000", "19006"]);

  app.use((req, res, next) => {
    const origins = new Set<string>();

    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }

    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }

    // Allow additional origins from environment
    if (process.env.CORS_ORIGINS) {
      process.env.CORS_ORIGINS.split(",").forEach((o) => {
        origins.add(o.trim());
      });
    }

    const origin = req.header("origin");

    // Allow localhost origins only on specific Expo/dev ports in development
    let isAllowedLocalhost = false;
    if (process.env.NODE_ENV === "development" && origin) {
      try {
        const url = new URL(origin);
        const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
        isAllowedLocalhost = isLocal && allowedLocalPorts.has(url.port);
      } catch {
        // Invalid origin URL
      }
    }

    if (origin && (origins.has(origin) || isAllowedLocalhost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Confirm-Reset");
      res.header("Access-Control-Allow-Credentials", "true");
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });
}

function setupBodyParsing(app: express.Application) {
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false }));
}

function setupRequestLogging(app: express.Application) {
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      if (!path.startsWith("/api")) return;

      const duration = Date.now() - start;

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    });

    next();
  });
}

function getAppName(): string {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

const metroProxy = createProxyMiddleware({
  target: "http://localhost:8081",
  changeOrigin: true,
  ws: true,
  on: {
    error: (_err: unknown, _req: unknown, res: unknown) => {
      if (res && typeof (res as Response).status === "function") {
        (res as Response).status(503).send("Metro bundler not available. Please wait for it to start.");
      }
    },
  },
});

function serveExpoManifest(platform: string, req: Request, res: Response) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json",
  );

  if (!fs.existsSync(manifestPath)) {
    return res
      .status(404)
      .json({ error: `Manifest not found for platform: ${platform}` });
  }

  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");

  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}

function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName,
}: {
  req: Request;
  res: Response;
  landingPageTemplate: string;
  appName: string;
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;

  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}

function configureExpoAndLanding(app: express.Application) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html",
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();

  const isDev = process.env.NODE_ENV === "development";

  log("Serving static Expo files with dynamic manifest routing");

  // Check if a web export exists in dist/
  const distPath = path.resolve(process.cwd(), "dist");
  const hasWebExport = fs.existsSync(path.join(distPath, "index.html"));

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    const platform = req.header("expo-platform");

    // Serve Expo Go manifests (mobile)
    if ((req.path === "/" || req.path === "/manifest") && (platform === "ios" || platform === "android")) {
      if (isDev) {
        return (metroProxy as express.RequestHandler)(req, res, next);
      }
      return serveExpoManifest(platform, req, res);
    }

    // In dev mode, proxy all Metro bundle/asset requests regardless of web export
    if (isDev) {
      const qPlatform = (req.query.platform as string) || "";
      if (
        qPlatform === "ios" ||
        qPlatform === "android" ||
        req.path.endsWith(".bundle") ||
        req.path.startsWith("/node_modules") ||
        req.path.startsWith("/__expo") ||
        req.path.startsWith("/.expo") ||
        req.path.startsWith("/hot") ||
        req.path === "/symbolicate"
      ) {
        return (metroProxy as express.RequestHandler)(req, res, next);
      }
    }

    // If web export exists, serve it (skip landing page and Metro proxy)
    if (hasWebExport) {
      return next();
    }

    // No web export: use Metro proxy in dev, landing page in prod
    if (isDev) {
      if (req.path === "/") {
        return serveLandingPage({ req, res, landingPageTemplate, appName });
      }
      return (metroProxy as express.RequestHandler)(req, res, next);
    }

    if (req.path === "/") {
      return serveLandingPage({ req, res, landingPageTemplate, appName });
    }

    next();
  });

  app.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app.use(express.static(path.resolve(process.cwd(), "static-build")));

  // Serve web export from dist/ with SPA fallback
  if (hasWebExport) {
    app.use(express.static(distPath, {
      maxAge: "1h",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
      },
    }));
    // SPA fallback: serve index.html for all non-API, non-file routes
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith("/api") || req.path.includes(".")) {
        return next();
      }
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(path.join(distPath, "index.html"));
    });
    log("Serving web app from dist/");
  }

  log("Expo routing: Checking expo-platform header on / and /manifest");
}

function setupErrorHandler(app: express.Application) {
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    const error = err as {
      status?: number;
      statusCode?: number;
      message?: string;
    };

    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });
}

(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);

  configureExpoAndLanding(app);

  const server = await registerRoutes(app);

  setupErrorHandler(app);

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`express server serving on port ${port}`);
    },
  );

  // Serve the web app on port 8081 too so Replit preview on any port shows the app
  const mirror8081 = express();
  mirror8081.use((_req: Request, res: Response) => {
    const target = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}${_req.originalUrl}`
      : `http://localhost:5000${_req.originalUrl}`;
    res.redirect(302, target);
  });
  mirror8081.listen({ port: 8081, host: "0.0.0.0" }, () => {
    log("Port 8081 redirect -> app on port 5000");
  });
})();
