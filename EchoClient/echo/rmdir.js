// https://gist.github.com/avisek/3d6a0404ffc141b008279e65a1ebf1ad 
import fs from "fs";

process.argv
    .slice(2)
    .map((path) => fs.rmdirSync(path, { recursive: true })); 

process.exit(0);