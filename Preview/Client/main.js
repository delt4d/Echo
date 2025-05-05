import express from "express";

const app = express();

app.use(express.static("public"));
app.use(express.static("../../Lib/Client/dist"));

app.listen(5500, (err) => {
    if (err) {
        console.error(err);
        return;
    }
    
    console.log(`Server running at port :5500`);
});