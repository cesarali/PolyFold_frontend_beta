// Accept either a Response or a Promise<Response>
export async function j<T>(res: Response | Promise<Response>): Promise<T> {
  const r = await res;
  if (!r.ok) {
    let msg = "";
    try { msg = await r.text(); } catch {}
    throw new Error(msg || r.statusText);
  }
  return r.json() as Promise<T>;
}
