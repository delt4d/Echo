import express from "express";

const app = express();
const echoLibPath = process.env.ECHO_LIB_PATH || "../../Lib/Client/dist";

app.use(express.static("public"));
app.use(express.static(echoLibPath));

app.listen(5500, (err) => {
    if (err) {
        console.error(err);
        return;
    }
    
    console.log(`Server running at port :5500`);
});