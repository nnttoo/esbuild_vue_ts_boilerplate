
import http from "http";  
import  {WebSocketServer }   from "ws"

export function createServer(port){ 
 
    let wss : WebSocketServer | null = null; 

    function createWs(server : http.Server){ 
        wss = new WebSocketServer ({ server, path: '/ws' });
    }

    function broadcastReload(){
        if( wss == null ) return;
        if(wss.clients == null) return;

        wss.clients.forEach((c)=>{
            c.send("reload");
        })
    }


    const server = http.createServer((req, res) => { 

        res.setHeader('Access-Control-Allow-Origin', '*'); // Izinkan semua origin
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Izinkan metode HTTP tertentu
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Izinkan header 
        res.writeHead(200, { 'Content-Type': 'text/plain' }); 
        
        res.end("");

        let path = req.url + "";

        if(path == "/reload"){
            let d = new Date();
            console.log("\n\n\n\nSERVER RELOAD : " + d.toLocaleTimeString() );
            broadcastReload();
        }
    });

    createWs(server); 
    // Menjalankan server
    server.listen(port, () => {
        console.log(`simplePageReload :  http://localhost:${port}/`);
    });

    let portResult = 0;

    let add = server.address();
    if(add != null && typeof add != "string"){
        portResult = add.port;
    }

    return { 
        port :  portResult ,
        reload : ()=>{
            
            let d = new Date();
            console.log("\n\n\n\nSERVER RELOAD : " + d.toLocaleTimeString() );
            broadcastReload();
        }
    }
}

export function callReloadServer(port){
   
    
    // Membuat permintaan HTTP
    const req =  http.request("http://localhost:" + port + "/reload", (res) => { 
        res.on("data",(d)=>{
            console.log("callReloadServer : " + d + "");
        })
        res.on('end', () => {
            console.log("Request Reload");
        });
    });

    req.on("error",(e)=>{
        console.log("request eror" + e.message);
    });
    req.end();
}