const express = require("express")
const app = express()
var cookieParser = require("cookie-parser")
const jwt = require("jsonwebtoken")
const cors = require("cors")
const multer = require("multer")
const mime = require("mime-types")
const path = require("path")

require("dotenv").config()
const fs = require("fs")
const port = process.env.PORT
const bodyParser = require("body-parser")

app.use(
    cors({
        origin: "*",
    })
)

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "forest/")
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, Date.now() + ext)
    },
})
const upload = multer({ storage: storage })

app.post("/images", upload.single("image"), (req, res, next) => {
    if (!req.file) {
        // Handle case where no file was uploaded
        return res.status(400).json({ error: "No file uploaded" })
    }
    const mimeType = mime.lookup(req.file.originalname)

    if (!mimeType || !mimeType.startsWith("image/")) {
        // Handle case where uploaded file is not an image
        return res.status(400).json({ error: "File must be an image" })
    }
    const filePath = req.file.path

    res.status(200).json({ success: true })
})

// Route for retrieving an image
app.get("/images/:filename", (req, res, next) => {
    const filePath = path.join(__dirname, "uploads", req.params.filename)

    // Return the image file
    res.sendFile(filePath)
})

const jsonErrorHandler = async (err, req, res, next) => {
    res.status(err.status).send(err)
}
app.use(jsonErrorHandler)

app.use(cookieParser())
app.use(bodyParser.json());

app.use((req, res, next) => {
    req.user = req.cookies.user

    next()
})

const files = fs.readdirSync("./routes/").filter((file) => file.endsWith(".js"))

for (const file of files) {
    const route = require(`./routes/${file}`)
    app.use(route.page, new route.Router())

    console.log(`Route ${file.toLowerCase()} launched`)
}

app.listen(port, () => console.log("Server on: http://localhost:" + port))