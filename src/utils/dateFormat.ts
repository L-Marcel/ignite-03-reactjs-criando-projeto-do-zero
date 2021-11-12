import { format } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";


export function dateFormat(date: Date) {
  return format(
    date,
    "d MMM Y",
    {
      locale: ptBR
    }
  );
};