namespace Bookly.Models;

/// <summary>
/// Representa una notificación que se muestra en el panel de la navbar.
/// Se construye en el controller y se pasa vía ViewBag.Notificaciones.
/// </summary>
public class Notificacion
{
    /// <summary>Texto principal de la notificación.</summary>
    public string Titulo { get; set; } = "";

    /// <summary>Texto secundario / descripción breve.</summary>
    public string Subtitulo { get; set; } = "";

    /// <summary>
    /// URL a la que navega al tocar la notificación.
    /// Si es null o vacío, la notificación no es clickeable.
    /// </summary>
    public string? Vinculo { get; set; }

    /// <summary>
    /// Ícono SVG inline (string completo). Si es null se usa el ícono de campana por defecto.
    /// </summary>
    public string? IconoSvg { get; set; }

    public Notificacion() { }

    public Notificacion(string titulo, string subtitulo, string? vinculo = null, string? iconoSvg = null)
    {
        Titulo    = titulo;
        Subtitulo = subtitulo;
        Vinculo   = vinculo;
        IconoSvg  = iconoSvg;
    }
}
