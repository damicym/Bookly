namespace Bookly.Models;
public class Publicacion
{
    public int id { get; set; }
    public string idVendedor { get; set; }
    public decimal precio { get; set; }
    public int status { get; set; }
    public string estadoLibro { get; set; }
    public string descripcion { get; set; }
    public DateTime fecha { get; set; }
}