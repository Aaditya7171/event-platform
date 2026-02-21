require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function scrapeEvents() {
    const url = "https://www.timeout.com/sydney/things-to-do";

    const response = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(response.data);

    const events = [];

    $("article").each((i, el) => {
        const title = $(el).find("h3").text().trim();
        const link = $(el).find("a").attr("href");

        if (!title || !link) return;

        events.push({
            title,
            datetime: new Date(),
            source: "TimeOut",
            originalUrl: link.startsWith("http")
                ? link
                : `https://www.timeout.com${link}`,
            city: "Sydney",
            status: "new"
        });
    });

    console.log("Events found:", events.length);

    for (const event of events) {
        try {
            await prisma.event.upsert({
                where: { originalUrl: event.originalUrl },
                update: {
                    lastScrapedAt: new Date()
                },
                create: event
            });

            console.log("Saved:", event.title);

        } catch (err) {
            console.log("ERROR:", err.message);
        }
    }

    console.log("Scraping complete");
}

scrapeEvents();