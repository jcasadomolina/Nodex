// Error con código HTTP. Se lanza desde cualquier ruta y el middleware de
// errores lo convierte en la respuesta adecuada:
//   throw new HttpError(404, "Nodex no encontrado");
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
