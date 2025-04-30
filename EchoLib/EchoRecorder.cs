using System.Threading.Channels;

namespace EchoLib;

public static class EchoRecorder
{
    public delegate IEchoCommand GetCommand(EchoData data);

    public static async Task HandleChannelReader(ChannelReader<EchoData> stream, GetCommand getCommand, CancellationToken cancellationToken = default)
    {
	    try
	    {
		    while (await stream.WaitToReadAsync(cancellationToken))
		    while (stream.TryRead(out var data))
			    await getCommand(data).ExecuteAsync();
	    }
	    catch (OperationCanceledException) {}
    }
	
	public static async Task HandleAsyncEnumerable(IAsyncEnumerable<EchoData> stream, GetCommand getCommand, CancellationToken cancellationToken = default)
	{
		try
		{
			await foreach (var data in stream.WithCancellation(cancellationToken))
				await getCommand(data).ExecuteAsync();
		}
		catch (OperationCanceledException) {}
	}
}