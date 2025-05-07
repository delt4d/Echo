using System.IO.Compression;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Serialization;

namespace EchoLib;

[JsonObject(MemberSerialization.OptOut, NamingStrategyType = typeof(SnakeCaseNamingStrategy))]
public struct EchoData
{
    [JsonConverter(typeof(StringEnumConverter))]
    public ActionType Type;    
    public string Content;
    public double TimeElapsed;

    public override string ToString()
    {
        var compressedContent = Content.CompressToBase64();
        return $"{Type},{TimeElapsed},{compressedContent}";
    }

    public static EchoData FromString(string line)
    {
        var arr = line.Split(',');
        var type = arr[0];
        var timeElapsed = arr[1];
        string content;
        {
            var compressedContent = arr[2];
            var compressedContentBytes = Convert.FromBase64String(compressedContent);
            using var input = new MemoryStream(compressedContentBytes);
            using var gzip = new GZipStream(input, CompressionMode.Decompress);
            using var output = new MemoryStream();
            gzip.CopyTo(output);
            content = Encoding.UTF8.GetString(output.ToArray());
        }
        return new EchoData
        {
            Type = Enum.Parse<ActionType>(type),
            Content = content,
            TimeElapsed = double.Parse(timeElapsed)
        };
    }
}