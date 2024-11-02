function sleep(n : number) {
    return new Promise((r, x) => {
        setTimeout(r, n);
    })
}

export async function simplePageReload(port : number) {
    let savedText = "";
    console.log("Simple Page Reloader started :" + port);
    const socket = new WebSocket('ws://localhost:'+port+'/ws');

    socket.onmessage = (msg)=>{
       if(msg.data == "reload"){
            window.location.reload();
       }
    } 

    socket.onclose = async ()=>{
        await sleep(3000);
        simplePageReload( port );
    }
}