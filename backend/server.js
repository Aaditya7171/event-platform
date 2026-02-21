require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("./auth");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
    app.set("trust proxy", 1);
}

app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}));

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(passport.initialize());
app.use(passport.session());

app.get("/events", async (req, res) => {
    const events = await prisma.event.findMany({
        orderBy: { datetime: "asc" }
    });
    res.json(events);
});

app.get("/auth/check", (req, res) => {
    if (req.isAuthenticated()) {
        const profile = req.user;
        return res.json({
            user: {
                name: profile.displayName || "",
                email: (profile.emails && profile.emails[0] && profile.emails[0].value) || "",
                photo: (profile.photos && profile.photos[0] && profile.photos[0].value) || ""
            }
        });
    }
    res.status(401).json({ error: "Unauthorized" });
});

app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: FRONTEND_URL }),
    (req, res) => {
        res.redirect(FRONTEND_URL);
    }
);

app.get("/auth/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: "Logout failed" });
        }
        req.session.destroy(() => {
            res.clearCookie("connect.sid");
            res.json({ success: true });
        });
    });
});

app.post("/lead", async (req, res) => {
    const { email, consent, eventId } = req.body;

    const lead = await prisma.lead.create({
        data: { email, consent, eventId }
    });

    res.json(lead);
});

app.post("/import/:id", async (req, res) => {
    const id = Number(req.params.id);

    const event = await prisma.event.update({
        where: { id },
        data: { status: "imported" }
    });

    res.json(event);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});