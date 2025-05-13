using EchoLib;
using System.Threading.Channels;
using Microsoft.AspNetCore.SignalR;

namespace EchoServer;

public class EchoHub : Hub
{
    private static string GetTestDataDirectoryLocation()
    {
        var workingDirectory = Environment.CurrentDirectory;
        var projectDirectory = Directory.GetParent(workingDirectory) ?? throw new DirectoryNotFoundException();
        return projectDirectory.FullName;
    }

    private static readonly string TestDataLocation = GetTestDataDirectoryLocation();

    public EchoHub()
    {
        Console.WriteLine(TestDataLocation);
    }
    
    public async Task Record(ChannelReader<EchoData> stream)
    {
        File.Delete(Path.Join(TestDataLocation, "TestData.txt"));
        
        await EchoRecorder.HandleChannelReader(stream, 
            (data) => new EchoSaveDataToFileCommand
                {
                    Data = data,
                    Directory = TestDataLocation,
                    Filename = "TestData.txt"
                });
    }

    public IAsyncEnumerable<EchoData> Mimic(CancellationToken cancellationToken)
    {
        return EchoMimic.GetDataFromFileAsync(TestDataLocation, "TestData.txt", cancellationToken);
    }
}