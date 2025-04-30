using System.IO.Compression;
using System.Text;
using Newtonsoft.Json;

namespace EchoLib;

public interface IEchoCommand
{
    public Task ExecuteAsync();
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
        var json64 = CompressToBase64(json);
        var line = json64 + Environment.NewLine;

        await File.AppendAllTextAsync(filePath, line, Encoding.UTF8);

        Console.WriteLine($"=> {filePath}" + Environment.NewLine);
    }
    
    private static string CompressToBase64(string input)
    {
        var bytes = Encoding.UTF8.GetBytes(input);
        using var output = new MemoryStream();
        using (var gzip = new GZipStream(output, CompressionLevel.Optimal))
        {
            gzip.Write(bytes, 0, bytes.Length);
        }
        return Convert.ToBase64String(output.ToArray());
    }
}