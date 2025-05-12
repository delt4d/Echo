/// <reference path="https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/8.0.7/signalr.js" />

/**
 * 
 * @param {Object || {}} params
 * @param {() => {}} params.onClose
 */
async function startConnection(params = {}) {
    params = params || {};
    const connection = new signalR.HubConnectionBuilder()
        .withUrl("http://localhost:5063/hub")
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Error)
        .build();
    
    connection.onclose(async () => {
        params?.onClose();
        console.log("Signalr connection closed.");
    });

    await connection.start();
    console.log("SignalR Connected.");
    
    return connection;
}
