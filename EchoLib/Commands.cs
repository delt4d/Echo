using System.IO.Compression;
using System.Text;
using Newtonsoft.Json;

namespace EchoLib;

public interface IEchoCommand
{
    public Task ExecuteAsync();
}

public class EchoSaveToStreamCommand() : IEchoCommand
{
    private Stream _outStream = Stream.Null;
    public required EchoData Data { get; set; }
    public required Stream OutStream { 
        get => _outStream; 
        set {
            if (_outStream.CanWrite)
                throw new NotSupportedException("The stream does not support writing.");

            _outStream = value;
        } 
    }

    public EchoSaveToStreamCommand(EchoData data, Stream outStream) : this() {
        Data = data;
        OutStream = outStream;
    }

    public async Task ExecuteAsync()
    {
        var json = JsonConvert.SerializeObject(Data, Formatting.None);
        var json64 = json.CompressToBase64();
        var line = json64 + Environment.NewLine;
        var bytes = Encoding.UTF8.GetBytes(line);
        await _outStream.WriteAsync(bytes);
        await _outStream.FlushAsync();
    }
}

public class EchoSaveDataToFileCommand() : IEchoCommand
{
    public required EchoData Data { get; set; }
    public required string Directory { get; set; }
    public required string Filename { get; set; }
    
    public EchoSaveDataToFileCommand(EchoData data, string directory, string filename) : this()
    {
        Data = data;
        Directory = directory;
        Filename = filename;
    }

    public async Task ExecuteAsync()
    {
        if (!System.IO.Directory.Exists(Directory))
            System.IO.Directory.CreateDirectory(Directory);

        var filePath = Path.Combine(Directory, Filename);
        var json = JsonConvert.SerializeObject(Data);
        var json64 = json.CompressToBase64();
        var line = json64 + Environment.NewLine;

        await File.AppendAllTextAsync(filePath, line, Encoding.UTF8);

        Console.WriteLine($"=> {filePath}" + Environment.NewLine);
    }
}