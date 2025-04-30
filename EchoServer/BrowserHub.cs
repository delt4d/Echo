using System.Runtime.CompilerServices;
using System.Threading.Channels;
using EchoLib;
using Microsoft.AspNetCore.SignalR;

namespace EchoServer;

public class BrowserHub : Hub
{
    public async Task ReceiveStream(ChannelReader<EchoData> stream)
    {
        await EchoRecorder.HandleChannelReader(stream, 
            (data) => new EchoSaveDataToFileCommand
            {
                Data = data,
                Directory = Path.GetTempPath(),
                Filename = $"User{Context.ConnectionId}.txt"
            });
    }

    public IAsyncEnumerable<EchoData> SendStream(CancellationToken cancellationToken)
    {
        return EchoMimic.GetDataFromFileAsync(Directory.GetCurrentDirectory(), "Test.txt", cancellationToken);
    }
}