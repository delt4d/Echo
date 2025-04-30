const { EchoRecorder } = Echo;

const echoRecorder = new EchoRecorder();
const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:5063/hub")
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Error)
    .build();

async function start() {
    try {
        const subject = new signalR.Subject();

        connection.onclose(async () => {
            echoRecorder.close();
            subject.complete();
            console.log("Signalr connection closed.")
        });

        await connection.start();
        console.log("SignalR Connected.");
        
        await connection.send("ReceiveStream", subject);
        
        for await (const echoData of echoRecorder.getChangesAsync()) {
            const data = echoData.toJson();
            console.log(data.type, data.time_elapsed, {data});
            subject.next(data);
        }

    } catch (err) {
        console.log({err});
    }
};

start()