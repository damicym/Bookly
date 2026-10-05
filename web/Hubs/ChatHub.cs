using Microsoft.AspNetCore.SignalR;

namespace Bookly.Hubs
{
    /// <summary>
    /// Hub de SignalR para el chat en tiempo real.
    /// Cada usuario se une a un grupo con su propio DNI como nombre,
    /// de modo que cualquier mensaje destinado a ese DNI se entrega
    /// a todas sus conexiones activas (múltiples pestañas/dispositivos).
    /// </summary>
    public class ChatHub : Hub
    {
        /// <summary>
        /// Al conectar, el cliente envía su DNI para unirse a su grupo personal.
        /// El servidor llamará a este método una vez que la conexión WebSocket esté abierta.
        /// </summary>
        public async Task UnirseAGrupo(string dniUsuario)
        {
            if (string.IsNullOrWhiteSpace(dniUsuario)) return;
            await Groups.AddToGroupAsync(Context.ConnectionId, dniUsuario);
        }

        /// <summary>
        /// Al desconectar (cierre de pestaña, logout, etc.) se limpia automáticamente.
        /// SignalR elimina la conexión de todos los grupos al desconectarse,
        /// por lo que no hace falta RemoveFromGroupAsync explícito.
        /// </summary>
        public override Task OnDisconnectedAsync(Exception? exception)
        {
            return base.OnDisconnectedAsync(exception);
        }
    }
}
