using System.Diagnostics.CodeAnalysis;
using System.IO.Compression;
using System.Runtime.CompilerServices;
using System.Text;
using Newtonsoft.Json;

namespace EchoLib;

public class EchoMimicHistory : IDisposable
{
    private readonly List<long> _lineOffsets = [0];
    private readonly StreamReader _reader;
    private readonly Stream _stream;
    private bool _endOfStream = false;
    private bool _disposed = false;

    public int NumberOfLines => _lineOffsets.Count - (_endOfStream ? 0 : 1);

    public EchoMimicHistory(Stream stream)
    {
        _stream = stream;
        _reader = new StreamReader(_stream, leaveOpen: false);
    }

    public EchoData ReadItem(int linePosition)
    {
        if (linePosition < 0) throw new IndexOutOfRangeException();
        
        EnsureNotDisposed();
        
        while (_lineOffsets.Count <= linePosition)
        {
            var line = _reader.ReadLine();
            
            if (line == null)
            {
                _endOfStream = true;
                break;
            }

            _lineOffsets.Add(_stream.Position);
        }

        if (linePosition >= _lineOffsets.Count - (_endOfStream ? 0 : 1))
            throw new IndexOutOfRangeException();

        _stream.Seek(_lineOffsets[linePosition], SeekOrigin.Begin);
        _reader.DiscardBufferedData();
        
        var content = _reader.ReadLine();

        if (content is null)
            throw new Exception($"{nameof(content)} was null");
        
        return EchoData.FromString(content);
    }
    
    private void EnsureNotDisposed()
    {
        ObjectDisposedException.ThrowIf(_disposed, nameof(EchoMimicHistory));
    }

    public void Dispose()
    {
        if (_disposed) return;

        _reader.Dispose();
        _stream.Dispose();

        _disposed = true;
        GC.SuppressFinalize(this);
    }
}


public static class EchoMimic
{
    public static EchoMimicHistory GetHistoryFromFileAsync(string directory, string filename, CancellationToken cancellationToken = default)
    {
        var filePath = Path.Combine(directory, filename);

        if (!File.Exists(filePath))
            throw new FileNotFoundException();

        var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
        
        return new EchoMimicHistory(stream);
    }
    
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