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
}