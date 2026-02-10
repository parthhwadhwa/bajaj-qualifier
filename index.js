require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const PORT = process.env.PORT || 3000;
const OFFICIAL_EMAIL = "jasmine3843.beai23@chitkara.edu.in";

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use(
    rateLimit({
        windowMs: 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            is_success: false,
            message: "Too many requests. Please try again later.",
        },
    })
);

function successResponse(data) {
    return {
        is_success: true,
        official_email: OFFICIAL_EMAIL,
        data,
    };
}

function errorResponse(message) {
    return {
        is_success: false,
        official_email: OFFICIAL_EMAIL,
        message,
    };
}

function fibonacci(n) {
    if (n <= 0) return [];
    if (n === 1) return [0];
    const series = [0, 1];
    for (let i = 2; i < n; i++) {
        series.push(series[i - 1] + series[i - 2]);
    }
    return series;
}

function isPrime(num) {
    if (num < 2) return false;
    if (num === 2) return true;
    if (num % 2 === 0) return false;
    for (let i = 3; i <= Math.sqrt(num); i += 2) {
        if (num % i === 0) return false;
    }
    return true;
}

function filterPrimes(arr) {
    return arr.filter(isPrime);
}

function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
        [a, b] = [b, a % b];
    }
    return a;
}

function lcm(a, b) {
    if (a === 0 || b === 0) return 0;
    return Math.abs(a * b) / gcd(a, b);
}

function computeHCF(arr) {
    return arr.reduce((acc, val) => gcd(acc, val));
}

function computeLCM(arr) {
    return arr.reduce((acc, val) => lcm(acc, val));
}

async function askAI(question) {
    if (!genAI) {
        throw new Error("AI service is not configured. Please set GEMINI_API_KEY.");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Answer the following question in exactly ONE word. Do not include any punctuation, explanation, or extra text. Only output a single word.\n\nQuestion: ${question}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    const firstWord = text.split(/\s+/)[0].replace(/[^a-zA-Z0-9\-]/g, "");
    return firstWord || text;
}

function isPositiveInteger(val) {
    return Number.isInteger(val) && val > 0;
}

function isNonNegativeInteger(val) {
    return Number.isInteger(val) && val >= 0;
}

function isIntegerArray(val) {
    return (
        Array.isArray(val) &&
        val.length > 0 &&
        val.every((v) => Number.isInteger(v))
    );
}

function isPositiveIntegerArray(val) {
    return (
        Array.isArray(val) &&
        val.length > 0 &&
        val.every((v) => Number.isInteger(v) && v > 0)
    );
}

const ALLOWED_KEYS = ["fibonacci", "prime", "lcm", "hcf", "AI"];

app.get("/health", (_req, res) => {
    return res.status(200).json({
        is_success: true,
        official_email: OFFICIAL_EMAIL,
    });
});

app.post("/bfhl", async (req, res) => {
    try {
        const body = req.body;

        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return res.status(400).json(errorResponse("Request body must be a JSON object."));
        }

        const presentKeys = ALLOWED_KEYS.filter(
            (k) => body[k] !== undefined && body[k] !== null
        );

        if (presentKeys.length === 0) {
            return res
                .status(400)
                .json(
                    errorResponse(
                        "Request must contain exactly one key: fibonacci, prime, lcm, hcf, or AI."
                    )
                );
        }

        if (presentKeys.length > 1) {
            return res
                .status(400)
                .json(
                    errorResponse(
                        "Request must contain exactly one key. Multiple keys found: " +
                        presentKeys.join(", ")
                    )
                );
        }

        const key = presentKeys[0];
        const value = body[key];

        if (key === "fibonacci") {
            if (!isNonNegativeInteger(value)) {
                return res
                    .status(400)
                    .json(
                        errorResponse(
                            "fibonacci value must be a non-negative integer."
                        )
                    );
            }
            if (value > 1000) {
                return res
                    .status(400)
                    .json(
                        errorResponse("fibonacci value must not exceed 1000.")
                    );
            }
            return res.status(200).json(successResponse(fibonacci(value)));
        }

        if (key === "prime") {
            if (!isIntegerArray(value)) {
                return res
                    .status(400)
                    .json(
                        errorResponse(
                            "prime value must be a non-empty array of integers."
                        )
                    );
            }
            return res.status(200).json(successResponse(filterPrimes(value)));
        }

        if (key === "lcm") {
            if (!isPositiveIntegerArray(value)) {
                return res
                    .status(400)
                    .json(
                        errorResponse(
                            "lcm value must be a non-empty array of positive integers."
                        )
                    );
            }
            return res.status(200).json(successResponse(computeLCM(value)));
        }

        if (key === "hcf") {
            if (!isPositiveIntegerArray(value)) {
                return res
                    .status(400)
                    .json(
                        errorResponse(
                            "hcf value must be a non-empty array of positive integers."
                        )
                    );
            }
            return res.status(200).json(successResponse(computeHCF(value)));
        }

        if (key === "AI") {
            if (typeof value !== "string" || value.trim().length === 0) {
                return res
                    .status(400)
                    .json(errorResponse("AI value must be a non-empty string."));
            }

            try {
                const answer = await askAI(value.trim());
                return res.status(200).json(successResponse(answer));
            } catch (aiError) {
                console.error("AI service error:", aiError.message);
                return res
                    .status(500)
                    .json(errorResponse("AI service encountered an error."));
            }
        }
    } catch (err) {
        console.error("Unhandled error in POST /bfhl:", err);
        return res.status(500).json(errorResponse("Internal server error."));
    }
});

app.use((_req, res) => {
    return res.status(404).json(errorResponse("Route not found."));
});

app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err);
    return res.status(500).json(errorResponse("Internal server error."));
});

app.listen(PORT, () => {
    console.log(`BFHL API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
