using EchoLib;
using System.Threading.Channels;
using Microsoft.AspNetCore.SignalR;

namespace EchoServer;

public class BrowserHub : Hub
{
    private static string GetTestDataDirectoryLocation()
    {
        var workingDirectory = Environment.CurrentDirectory; // (i.e. \bin\Debug)
        var projectDirectory = Directory.GetParent(workingDirectory)?.Parent?.Parent ?? throw new DirectoryNotFoundException();
        return projectDirectory.FullName;
    }
    
    public async Task ReceiveStream(ChannelReader<EchoData> stream)
    {
        File.Delete(Path.Join(GetTestDataDirectoryLocation(), "TestData.txt"));
        
        await EchoRecorder.HandleChannelReader(stream, 
            (data) => new EchoSaveDataToFileCommand
                {
                    Data = data,
                    Directory = GetTestDataDirectoryLocation(),
                    Filename = "TestData.txt"
                });
    }

    public IAsyncEnumerable<EchoData> SendStream(CancellationToken cancellationToken)
    {
        return EchoMimic.GetDataFromFileAsync(GetTestDataDirectoryLocation(), "TestData.txt", cancellationToken);
    }
}