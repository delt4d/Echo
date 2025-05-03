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

    const echoMimic = new EchoMimic(document.getElementById("echo"));

    connection.stream("SendStream")
        .subscribe({
            async next(data) {
                await echoMimic.enqueueAsync(EchoData.fromJson(data));
            },
            error(err) {
                console.log(err);
            }
        });
}

window.addEventListener("DOMContentLoaded", start);