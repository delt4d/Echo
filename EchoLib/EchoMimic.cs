using System.IO.Compression;
using System.Runtime.CompilerServices;
using System.Text;
using Newtonsoft.Json;

namespace EchoLib;

public static class EchoMimic
{
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

            EchoData data;

            try
            {
                var decompressed = DecompressFromBase64(line);
                data = JsonConvert.DeserializeObject<EchoData>(decompressed);
            }
            catch (JsonException)
            {
                Console.WriteLine($"Unable to deserialize.");
                throw;
            }
            
            yield return data;
        }
    }
    
    private static string DecompressFromBase64(string base64)
    {
        var compressedBytes = Convert.FromBase64String(base64);
        using var input = new MemoryStream(compressedBytes);
        using var gzip = new GZipStream(input, CompressionMode.Decompress);
        using var output = new MemoryStream();
        gzip.CopyTo(output);
        return Encoding.UTF8.GetString(output.ToArray());
    }
}