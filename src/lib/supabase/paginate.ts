import type { PostgrestError } from '@supabase/supabase-js'

// O PostgREST/Supabase devolve no máximo 1000 linhas por requisição (limite
// `max-rows` padrão). Leituras agregadas que varrem uma tabela inteira precisam
// paginar, senão truncam em silêncio.
const PAGE_SIZE = 1000

type RangeResult<T> = PromiseLike<{ data: T[] | null; error: PostgrestError | null }>
interface Rangeable<T> {
  range(from: number, to: number): RangeResult<T>
}

/**
 * Lê TODAS as linhas de uma query Supabase, contornando o limite padrão de 1000
 * linhas do PostgREST. Pagina com `.range()` até a página voltar incompleta.
 *
 * `buildQuery` precisa devolver uma query NOVA a cada chamada (a partir do
 * `.select()`), porque cada página aplica um `.range()` diferente sobre uma
 * instância limpa.
 *
 * Lança em erro de query — preferimos falhar visível a devolver um conjunto
 * parcial que vira contagem errada.
 */
export async function fetchAllRows<T>(buildQuery: () => Rangeable<T>): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(`fetchAllRows: ${error.message}`)
    if (!data?.length) break
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
  }
  return rows
}
