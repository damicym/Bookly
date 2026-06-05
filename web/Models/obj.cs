using Newtonsoft.Json;
using System;


namespace Bookly.Models;

public class obj
{
    public static string ObjectToString<T>(T obj)
    {
        return JsonConvert.SerializeObject(obj);
    }

    public static T? StringToObject<T>(string txt)
    {
        if (string.IsNullOrEmpty(txt))
            return default;
        else
            return JsonConvert.DeserializeObject<T>(txt);
    }
}
