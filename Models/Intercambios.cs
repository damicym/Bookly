namespace Bookly.Models;
public class Intercambio
{
    public int id { get; set; }
    public int idLibro { get; set; }
    public DateTime fechaPublicacion { get; set; }
    public decimal precio { get; set; }
    public string idComprador { get; set; }
    public string idVendedor { get; set; }
    public string estado { get; set; }
    public string descripcion { get; set; }
    public DateTime fechaRealizacion { get; set; }
    public string imagen { get; set; }
}