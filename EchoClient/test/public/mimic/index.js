const { EchoMimic, EchoData } = echo;

const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:5063/hub")
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Error)
    .build();

async function start() {
    connection.onclose(async () => {
        console.log("Signalr connection closed.")
    });

    await connection.start();
    console.log("SignalR Connected.");

    let processing = false;

    const echoMimic = new EchoMimic(document.getElementById("echo"));
    const queue = [];
    const processNext = async (ignoreProcessing = false) => {
        if (processing && !ignoreProcessing) return;
        processing = true;
        
        const item = queue.shift();
        
        if (!item) {
            processing = false;
            return;
        }

        await echoMimic.executeAsync(EchoData.fromJson(item));

        return await processNext(true);
    }

    connection.stream("SendStream")
        .subscribe({
            async next(data) {
                queue.push(data);
                await processNext();
            },
            error(err) {
                console.log(err);
            }
        });
}

window.addEventListener("DOMContentLoaded", start);