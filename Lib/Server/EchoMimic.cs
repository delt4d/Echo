using System.Diagnostics.CodeAnalysis;
using System.IO.Compression;
using System.Runtime.CompilerServices;
using System.Text;
using Newtonsoft.Json;

namespace EchoLib;

public static class EchoMimic
{
    public static IAsyncEnumerable<EchoData> GetDataFromFileAsync(string path, CancellationToken cancellationToken = default)
    {
        var directory = Path.GetDirectoryName(path);
        var filename = Path.GetFileName(path);

        if (directory == null)
            throw new ArgumentException("Path must include a directory.", nameof(path));

        if (filename == null)
            throw new ArgumentException("Path must include a file name.", nameof(path));

        return GetDataFromFileAsync(directory, filename, cancellationToken);
    }
    
    public static async IAsyncEnumerable<EchoData> GetDataFromFileAsync(string directory, string filename, [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var filePath = Path.Combine(directory, filename);

        if (!File.Exists(filePath))
            yield break;

        await using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
        using var reader = new StreamReader(stream);

        while (!reader.EndOfStream && !cancellationToken.IsCancellationRequested)
        {
            var line = await reader.ReadLineAsync(cancellationToken);

            if (string.IsNullOrWhiteSpace(line))
                continue;

            var data = EchoData.FromString(line);
            
            yield return data;
        }
    }
}