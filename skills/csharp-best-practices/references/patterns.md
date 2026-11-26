# C# patterns

Code examples for the rules in `SKILL.md`. The underlying principles are language-agnostic. See the **type-system-discipline** and **boundary-discipline** principle skills.

## Closed variants

```csharp
public abstract record LoadState
{
    private LoadState() { }
    public sealed record Loading : LoadState;
    public sealed record Ready(Drawing Drawing) : LoadState;
    public sealed record Failed(string Error) : LoadState;
}

static string Describe(LoadState state) => state switch
{
    LoadState.Loading => "loading",
    LoadState.Ready ready => ready.Drawing.Title,
    LoadState.Failed failed => failed.Error,
    _ => throw new InvalidOperationException($"unhandled state {state.GetType().Name}"),
};
```

The private constructor closes the set, since only nested types can derive from it. The compiler does not know that, so without the discard arm it reports CS8509 even when every case is listed, and `-warnaserror` fails the build. The throwing arm keeps the build green and turns a forgotten case into a loud failure that one test over all cases catches.

## Strong ids

```csharp
public readonly record struct ElementId(string Value)
{
    public static bool TryParse(string? input, out ElementId id)
    {
        id = default;
        if (string.IsNullOrWhiteSpace(input) || !input.StartsWith('/')) return false;
        id = new ElementId(input);
        return true;
    }
}
```

## Expected failure without exceptions

```csharp
public static bool TryReadSettings(string path, out Settings settings, out string error)
{
    settings = default!;
    error = "";
    if (!File.Exists(path)) { error = $"settings file not found: {path}"; return false; }
    var parsed = JsonSerializer.Deserialize<Settings>(File.ReadAllText(path));
    if (parsed is null) { error = "settings file is empty"; return false; }
    settings = parsed;
    return true;
}
```

## UI thread

```csharp
private async void exportButton_Click(object sender, EventArgs e)
{
    exportButton.Enabled = false;
    try
    {
        var report = await Task.Run(() => exporter.Export(selection, cancellation.Token));
        statusLabel.Text = $"{report.Rows} rows exported";
    }
    finally
    {
        exportButton.Enabled = true;
    }
}
```

An event handler is the one place `async void` is correct. The `await` returns to the UI thread, so the label update is safe.

## Vendor assemblies

```csharp
static Assembly? ResolveVendor(object? sender, ResolveEventArgs args)
{
    var name = new AssemblyName(args.Name).Name + ".dll";
    var path = Path.Combine(VendorSettings.InstallFolder, name);
    return File.Exists(path) ? Assembly.LoadFrom(path) : null;
}

static void Main()
{
    AppDomain.CurrentDomain.AssemblyResolve += ResolveVendor;
    Run();
}
```

`VendorSettings.InstallFolder` comes from configuration. Keep every vendor type out of `Main` itself, because the runtime resolves a method's types before its first line runs.
