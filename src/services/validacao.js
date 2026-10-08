class ErroAplicacao extends Error {
  constructor(status, mensagem) { super(mensagem); this.status = status; }
}
const falhar = (status, mensagem) => { throw new ErroAplicacao(status, mensagem); };
function objeto(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) falhar(400, 'Informe os dados em um objeto JSON.');
  return value;
}
function valor(body, key, current, fallback) {
  if (body[key] !== undefined) return body[key];
  if (current && current[key] !== undefined) return current[key];
  return fallback;
}
function texto(value, label, max = 150) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) falhar(400, `${label} deve ter entre 1 e ${max} caracteres.`);
  return value.trim();
}
function numero(value, label, max = 99999999.99) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > max) falhar(400, `${label} deve ser um número maior que zero e até ${max}.`);
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  if (rounded < 0.01) falhar(400, `${label} deve ser de pelo menos 0.01.`);
  return rounded;
}
function id(value, label = 'Identificador') {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1 || value > 4294967295) falhar(400, `${label} inválido.`);
  return value;
}
function idParametro(value, label = 'Identificador') {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) falhar(400, `${label} inválido.`);
  return id(Number(value), label);
}
function opcao(value, options, label) {
  if (!options.includes(value)) falhar(400, `${label} inválido. Opções: ${options.join(', ')}.`);
  return value;
}
function data(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) falhar(400, 'Data agendada deve usar o formato AAAA-MM-DD.');
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (year < 1000 || year > 9999 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) falhar(400, 'Data agendada inválida.');
  return value;
}
function pontos(value) {
  if (!Array.isArray(value) || value.length < 2 || value.length > 30) falhar(400, 'Informe de 2 a 30 pontos para o percurso.');
  return value.map(point => {
    objeto(point);
    const { lat, lng } = point;
    if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) falhar(400, 'Coordenadas inválidas no percurso.');
    return { lat, lng };
  });
}
function paginacao(query) {
  const get = (value, fallback, max) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) > max) falhar(400, 'Paginação inválida.');
    return Number(value);
  };
  const pagina = get(query.pagina, 1, 1000000);
  const limite = get(query.limite, 10, 100);
  return { pagina, limite, limit: limite, offset: (pagina - 1) * limite };
}
function busca(value) { return value === undefined ? '' : texto(value, 'Busca', 200); }
function semAutoria(body) {
  if ('usuario_id' in body || 'atualizado_por_id' in body) falhar(400, 'A autoria é definida pelo usuário autenticado.');
}
function corresponde(a, b) { return a.trim().toLocaleLowerCase('pt-BR') === b.trim().toLocaleLowerCase('pt-BR'); }
module.exports = { ErroAplicacao, falhar, objeto, valor, texto, numero, id, idParametro, opcao, data, pontos, paginacao, busca, semAutoria, corresponde };
