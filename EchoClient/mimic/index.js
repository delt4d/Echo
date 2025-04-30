const { EchoMimic, EchoData } = Echo;

const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:5063/hub")
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Error)
    .build();

async function start() {
    try {
        connection.onclose(async () => {
            subject.complete();
            console.log("Signalr connection closed.")
        });

        await connection.start();
        console.log("SignalR Connected.");

        let processing = false;

        const echoMimic = new EchoMimic("echo-frame");
        const queue = [];
        const processNext = async (ignoreProcessing = false) => {
            if (processing && !ignoreProcessing) return;
            processing = true;
            
            const data = queue.shift();
            
            if (!data) {
                processing = false;
                return;
            }

            await echoMimic.executeAsync(data);

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

        setTimeout(() => {
            window.location.href = window.location.href;
        }, 24000)
    } catch (err) {
        console.log({err});
    }
};

start()