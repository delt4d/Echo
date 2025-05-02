import express from "express";

const app = express();

app.get('/', (req, res) => res.sendStatus(200));
app.use(express.static("public"));
app.use(express.static("../lib/dist"));

app.listen(5500, (err) => {
    if (err) {
        console.error(err);
        return;
    }
    
    console.log(`Server running at port :5500`);
    
    const url = "http://localhost:5500";
   
    console.log("\nRoutes:" +
        `\n${url}/mimic` +
        `\n${url}/recorder`
    );
});