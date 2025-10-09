namespace Bookly.Models;
public class Resena
{
    public int id { get; set; }
    public string idRedactor { get; set; }    
    public string IdReceptor { get; set; }
    public DateTime fecha { get; set; }
    public string contenido { get; set; }
    public float valoracion { get; set; }
}