# PML patterns

Examples for the rules in `SKILL.md`. Each one names its source the same way: `standalone` and `launcher` come from the user's checked E3D skills, and `unverified` examples have not been run. Confirm an `unverified` example in E3D before copying it.

## A generated macro and its host (standalone)

The host writes the macro as UTF-8, runs it, and reads the result back.

```
onerror continue
VAR !result FLNN
$P $!result
```

```csharp
File.WriteAllText(macroPath, macroText, Encoding.UTF8);
Command command = Command.CreateCommand("$M /" + macroPath);
if (!command.Run())
{
    throw new InvalidOperationException(command.Error.MessageText());
}
string output = command.Result.Trim();
```

`onerror continue` is acceptable here only because the host checks `Run()` and reads the output.

## Starting a console session with a macro (launcher)

```text
mon.exe PROD E3D init "<install folder>\launch.init" TTY <PROJECT> <user>/<password> /<MDB> <macro path>
```

Build this line at run time from a configuration file that is not tracked. `TTY` runs without a window, `CONSOLE` shows one for debugging.

## A function in its own file (unverified)

```
define function !!projPipeLength(!pipe is DBREF) is REAL
    !total = 0
    do !branch values !pipe.members
        !total = !total + 1
    enddo
    return !total
endfunction
```

## Handling one expected error (unverified)

```
!file = object FILE(!path)
!file.open('READ')
handle ANY
    $P cannot open $!path
    return
endhandle
```

Replace the catch-all with the module and number of the one error you expect. Read both from the command window the first time the failure happens.
