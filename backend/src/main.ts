import express from 'express';
import { join } from 'path'; 

import dotenv from "dotenv"
dotenv.config();

console.log("iserver ss");
 
const app = express();
const port = process.env.SERVERPORT || '3030';
 
 

// Middleware express.static untuk melayani file statis dari folder 'public'
app.use(express.static(join(__dirname, 'public'))); 

let portNum = Number(port); 
// Menjalankan server pada port yang ditentukan
app.listen(port, () => {
  console.log(`Server url : http://localhost:${port}`);
});
  
