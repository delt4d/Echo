using System.IO.Compression;
using System.Text;

namespace EchoLib;

public static class Extensions
{
    public static string CompressToBase64(this string input)
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